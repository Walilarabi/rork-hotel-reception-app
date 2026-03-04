import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { ChatbotFaqItem, CHATBOT_FAQ } from '@/mocks/chatbotFaq';
import { AdminUserRole } from '@/constants/types';

const FAQ_KEY = 'chatbot_faq_items';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
  faqId?: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function computeSimilarity(query: string, faq: ChatbotFaqItem, userRole: AdminUserRole | null): number {
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  if (queryWords.length === 0) return 0;

  if (faq.roles.length > 0 && userRole && !faq.roles.includes(userRole)) {
    return 0;
  }

  let score = 0;
  const normalizedQuestion = normalizeText(faq.question);
  const normalizedAnswer = normalizeText(faq.answer);
  const normalizedKeywords = faq.keywords.map(normalizeText);

  for (const word of queryWords) {
    if (normalizedKeywords.some(kw => kw.includes(word) || word.includes(kw))) {
      score += 3;
    }
    if (normalizedQuestion.includes(word)) {
      score += 2;
    }
    if (normalizedAnswer.includes(word)) {
      score += 0.5;
    }
  }

  if (normalizedQuestion.includes(normalizedQuery)) {
    score += 5;
  }

  const totalPossible = queryWords.length * 5.5;
  return totalPossible > 0 ? score / totalPossible : 0;
}

export const [ChatbotProvider, useChatbot] = createContextHook(() => {
  const [faqItems, setFaqItems] = useState<ChatbotFaqItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const faqQuery = useQuery({
    queryKey: ['chatbot_faq'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(FAQ_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed as ChatbotFaqItem[];
        }
      } catch (e) {
        console.log('[ChatbotProvider] Error reading FAQ:', e);
        await AsyncStorage.removeItem(FAQ_KEY);
      }
      await AsyncStorage.setItem(FAQ_KEY, JSON.stringify(CHATBOT_FAQ));
      return CHATBOT_FAQ;
    },
  });

  const syncFaq = useCallback(async (items: ChatbotFaqItem[]) => {
    await AsyncStorage.setItem(FAQ_KEY, JSON.stringify(items));
  }, []);

  const addFaqMutation = useMutation({
    mutationFn: async (item: Omit<ChatbotFaqItem, 'id' | 'usageCount'>) => {
      const newItem: ChatbotFaqItem = { ...item, id: `faq-${Date.now()}`, usageCount: 0 };
      const updated = [...faqItems, newItem];
      setFaqItems(updated);
      await syncFaq(updated);
      return newItem;
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<ChatbotFaqItem> }) => {
      const updated = faqItems.map(f => f.id === params.id ? { ...f, ...params.updates } : f);
      setFaqItems(updated);
      await syncFaq(updated);
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = faqItems.filter(f => f.id !== id);
      setFaqItems(updated);
      await syncFaq(updated);
    },
  });

  useState(() => {
    if (faqQuery.data) {
      setFaqItems(faqQuery.data);
    }
  });

  if (faqQuery.data && faqItems.length === 0) {
    setFaqItems(faqQuery.data);
  }

  const findAnswer = useCallback((query: string, userRole: AdminUserRole | null): { answer: string; faqId?: string; suggestions: string[] } => {
    const activeItems = faqItems.filter(f => f.isActive);
    const scored = activeItems.map(faq => ({
      faq,
      score: computeSimilarity(query, faq, userRole),
    })).sort((a, b) => b.score - a.score);

    const CONFIDENCE_THRESHOLD = 0.25;
    const topMatch = scored[0];

    if (topMatch && topMatch.score >= CONFIDENCE_THRESHOLD) {
      const updatedItems = faqItems.map(f =>
        f.id === topMatch.faq.id ? { ...f, usageCount: f.usageCount + 1 } : f
      );
      setFaqItems(updatedItems);
      syncFaq(updatedItems);

      const suggestions = scored
        .slice(1, 4)
        .filter(s => s.score >= CONFIDENCE_THRESHOLD * 0.5)
        .map(s => s.faq.question);

      return {
        answer: topMatch.faq.answer,
        faqId: topMatch.faq.id,
        suggestions,
      };
    }

    const roleFaqs = activeItems
      .filter(f => f.roles.length === 0 || (userRole && f.roles.includes(userRole)))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3)
      .map(f => f.question);

    return {
      answer: 'Je n\'ai pas trouvé de réponse à votre question.\n\nSuggestions :\n• Reformulez votre question\n• Consultez notre base d\'aide en ligne\n• Contactez le support à support@flowtym.com',
      suggestions: roleFaqs,
    };
  }, [faqItems, syncFaq]);

  const sendMessage = useCallback((text: string, userRole: AdminUserRole | null) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      message: text,
      timestamp: new Date().toISOString(),
    };

    const result = findAnswer(text, userRole);

    const botMsg: ChatMessage = {
      id: `msg-${Date.now()}-b`,
      sender: 'bot',
      message: result.answer,
      timestamp: new Date().toISOString(),
      faqId: result.faqId,
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    return result.suggestions;
  }, [findAnswer]);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const stats = useMemo(() => {
    const total = faqItems.length;
    const active = faqItems.filter(f => f.isActive).length;
    const totalUsage = faqItems.reduce((sum, f) => sum + f.usageCount, 0);
    const topQuestions = [...faqItems].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
    const categories = [...new Set(faqItems.map(f => f.category))];
    return { total, active, totalUsage, topQuestions, categories };
  }, [faqItems]);

  return {
    faqItems,
    messages,
    isOpen,
    isLoading: faqQuery.isLoading,
    stats,
    sendMessage,
    clearConversation,
    toggleOpen,
    setIsOpen,
    addFaq: addFaqMutation.mutate,
    updateFaq: updateFaqMutation.mutate,
    deleteFaq: deleteFaqMutation.mutate,
  };
});

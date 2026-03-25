import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  ChatbotFaqItem,
  CHATBOT_FAQ,
  normalizeText,
  extractKeywords,
  OUT_OF_SCOPE_KEYWORDS,
  COMMERCIAL_KEYWORDS,
} from '@/mocks/chatbotFaq';
import { AdminUserRole } from '@/constants/types';

const FAQ_KEY = 'chatbot_faq_items_v2';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
  faqId?: string;
  type?: 'answer' | 'out_of_scope' | 'commercial' | 'no_match' | 'ambiguous' | 'welcome';
}

interface MatchResult {
  faq: ChatbotFaqItem;
  score: number;
  matchedKeywords: string[];
}

const NO_MATCH_RESPONSE = '🤔 Je n\'ai pas trouvé de réponse à votre question.\n\nSuggestions :\n• Reformulez votre question avec des termes plus simples\n• Vérifiez que vous utilisez les bons termes (ex: "assigner" plutôt que "donner")\n\n📧 Vous pouvez aussi contacter notre support :\nsupport@flowtym.com';

const OUT_OF_SCOPE_RESPONSE = '⚠️ Je suis conçu pour vous aider à utiliser l\'application FLOWTYM, pas pour répondre à des questions techniques sur son fonctionnement.\n\nSi vous avez un problème d\'utilisation, reformulez votre question.\n\nPour toute question technique ou commerciale :\n📧 support@flowtym.com';

const COMMERCIAL_RESPONSE = '💼 Pour toute question commerciale (tarifs, abonnements, personnalisations, nouvelles fonctionnalités), merci de contacter notre équipe commerciale :\n\n📧 commercial@flowtym.com\n📞 Contactez votre Customer Success Manager\n\nJe suis là pour vous aider à utiliser l\'application !';

function isOutOfScope(normalizedQuery: string): boolean {
  const queryWords = normalizedQuery.split(' ');
  for (const keyword of OUT_OF_SCOPE_KEYWORDS) {
    const normalizedKw = normalizeText(keyword);
    if (normalizedQuery.includes(normalizedKw)) {
      return true;
    }
    for (const word of queryWords) {
      if (word === normalizedKw) {
        return true;
      }
    }
  }
  return false;
}

function isCommercialQuery(normalizedQuery: string): boolean {
  for (const keyword of COMMERCIAL_KEYWORDS) {
    const normalizedKw = normalizeText(keyword);
    if (normalizedQuery.includes(normalizedKw)) {
      return true;
    }
  }
  return false;
}

function hasForbiddenKeyword(normalizedQuery: string, forbiddenKeywords: string[]): boolean {
  if (forbiddenKeywords.length === 0) return false;
  for (const forbidden of forbiddenKeywords) {
    const normalizedForbidden = normalizeText(forbidden);
    if (normalizedQuery.includes(normalizedForbidden)) {
      return true;
    }
  }
  return false;
}

function matchFaq(
  query: string,
  faqItems: ChatbotFaqItem[],
  userRole: AdminUserRole | null
): { answer: string; faqId?: string; suggestions: string[]; type: ChatMessage['type'] } {
  const normalizedQuery = normalizeText(query);
  const queryWords = extractKeywords(query);

  console.log('[Chatbot] Query:', query);
  console.log('[Chatbot] Normalized:', normalizedQuery);
  console.log('[Chatbot] Keywords:', queryWords);
  console.log('[Chatbot] User role:', userRole);

  if (isOutOfScope(normalizedQuery)) {
    console.log('[Chatbot] OUT OF SCOPE detected');
    return {
      answer: OUT_OF_SCOPE_RESPONSE,
      suggestions: getDefaultSuggestions(faqItems, userRole),
      type: 'out_of_scope',
    };
  }

  if (isCommercialQuery(normalizedQuery)) {
    console.log('[Chatbot] COMMERCIAL query detected');
    return {
      answer: COMMERCIAL_RESPONSE,
      suggestions: getDefaultSuggestions(faqItems, userRole),
      type: 'commercial',
    };
  }

  const activeItems = faqItems.filter(f => f.isActive);
  const matches: MatchResult[] = [];

  for (const faq of activeItems) {
    if (faq.roles.length > 0 && userRole && !faq.roles.includes(userRole)) {
      continue;
    }

    if (hasForbiddenKeyword(normalizedQuery, faq.forbiddenKeywords)) {
      continue;
    }

    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of faq.keywords) {
      const normalizedKw = normalizeText(keyword);
      const kwParts = normalizedKw.split(' ');

      if (kwParts.length > 1) {
        if (normalizedQuery.includes(normalizedKw)) {
          matchedKeywords.push(keyword);
          score += kwParts.length * 3;
        }
      } else {
        if (normalizedQuery.includes(normalizedKw)) {
          matchedKeywords.push(keyword);
          score += 3;
        } else {
          for (const qWord of queryWords) {
            if (qWord === normalizedKw || 
                (qWord.length > 3 && normalizedKw.length > 3 && 
                 (qWord.startsWith(normalizedKw.substring(0, Math.min(4, normalizedKw.length))) ||
                  normalizedKw.startsWith(qWord.substring(0, Math.min(4, qWord.length)))))) {
              matchedKeywords.push(keyword);
              score += 2;
              break;
            }
          }
        }
      }
    }

    const normalizedQuestion = normalizeText(faq.question);
    if (normalizedQuery === normalizedQuestion) {
      score += 100;
    } else if (normalizedQuestion.includes(normalizedQuery) || normalizedQuery.includes(normalizedQuestion)) {
      score += 20;
    }

    const minKeywordsRequired = Math.max(1, Math.ceil(faq.keywords.length * 0.3));
    
    if (matchedKeywords.length >= minKeywordsRequired && score >= 3) {
      const roleBonus = faq.roles.length > 0 && userRole && faq.roles.includes(userRole) ? 10 : 0;
      matches.push({
        faq,
        score: score + roleBonus + faq.priority,
        matchedKeywords,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  console.log('[Chatbot] Matches found:', matches.length);
  if (matches.length > 0) {
    console.log('[Chatbot] Top match:', matches[0].faq.id, 'score:', matches[0].score, 'keywords:', matches[0].matchedKeywords);
  }

  if (matches.length === 0) {
    return {
      answer: NO_MATCH_RESPONSE,
      suggestions: getDefaultSuggestions(faqItems, userRole),
      type: 'no_match',
    };
  }

  const topMatch = matches[0];

  if (matches.length > 1 && matches[1].score >= topMatch.score * 0.9 && topMatch.score < 20) {
    const options = matches.slice(0, 3).map((m, i) => {
      const letter = String.fromCharCode(65 + i);
      return `${letter}. ${m.faq.question}`;
    });

    return {
      answer: `J'ai plusieurs possibilités. Pouvez-vous préciser ?\n\n${options.join('\n')}\n\nCliquez sur une suggestion ci-dessous ou reformulez votre question.`,
      suggestions: matches.slice(0, 3).map(m => m.faq.question),
      type: 'ambiguous',
    };
  }

  const relatedSuggestions = topMatch.faq.relatedIds
    .map(id => activeItems.find(f => f.id === id))
    .filter((f): f is ChatbotFaqItem => f !== undefined)
    .filter(f => f.roles.length === 0 || (userRole && f.roles.includes(userRole)))
    .slice(0, 3)
    .map(f => f.question);

  const fallbackSuggestions = matches
    .slice(1, 4)
    .filter(m => m.score >= 3)
    .map(m => m.faq.question);

  const suggestions = relatedSuggestions.length > 0 ? relatedSuggestions : fallbackSuggestions;

  return {
    answer: topMatch.faq.answer,
    faqId: topMatch.faq.id,
    suggestions: suggestions.length > 0 ? suggestions : getDefaultSuggestions(faqItems, userRole),
    type: 'answer',
  };
}

function getDefaultSuggestions(faqItems: ChatbotFaqItem[], userRole: AdminUserRole | null): string[] {
  const activeItems = faqItems.filter(f => f.isActive);
  const roleItems = activeItems.filter(f =>
    f.roles.length === 0 || (userRole && f.roles.includes(userRole))
  );
  return roleItems
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3)
    .map(f => f.question);
}

export const [ChatbotProvider, useChatbot] = createContextHook(() => {
  const [faqItems, setFaqItems] = useState<ChatbotFaqItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const faqQuery = useQuery({
    queryKey: ['chatbot_faq_v2'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(FAQ_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].forbiddenKeywords !== undefined) {
            return parsed as ChatbotFaqItem[];
          }
        }
      } catch (e) {
        console.log('[ChatbotProvider] Error reading FAQ:', e);
        await AsyncStorage.removeItem(FAQ_KEY);
      }
      await AsyncStorage.setItem(FAQ_KEY, JSON.stringify(CHATBOT_FAQ));
      return CHATBOT_FAQ;
    },
  });

  useEffect(() => {
    if (faqQuery.data && faqQuery.data.length > 0) {
      setFaqItems(faqQuery.data);
    }
  }, [faqQuery.data]);

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

  const findAnswer = useCallback((query: string, userRole: AdminUserRole | null): { answer: string; faqId?: string; suggestions: string[]; type: ChatMessage['type'] } => {
    const result = matchFaq(query, faqItems, userRole);

    if (result.faqId) {
      const updatedItems = faqItems.map(f =>
        f.id === result.faqId ? { ...f, usageCount: f.usageCount + 1 } : f
      );
      setFaqItems(updatedItems);
      syncFaq(updatedItems);
    }

    return result;
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
      type: result.type,
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
    const byRole: Record<string, number> = {};
    for (const faq of faqItems) {
      if (faq.roles.length === 0) {
        byRole['all'] = (byRole['all'] || 0) + 1;
      } else {
        for (const role of faq.roles) {
          byRole[role] = (byRole[role] || 0) + 1;
        }
      }
    }
    return { total, active, totalUsage, topQuestions, categories, byRole };
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

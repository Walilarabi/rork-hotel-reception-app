import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { MessageCircle, X, Send, Trash2, ChevronRight, Sparkles, HelpCircle, ArrowUpRight, AlertTriangle, ShieldAlert, Briefcase } from 'lucide-react-native';
import { useChatbot, ChatMessage } from '@/providers/ChatbotProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscriptions } from '@/providers/SubscriptionProvider';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/providers/ThemeProvider';
import { AdminUserRole } from '@/constants/types';

const PLANS_WITH_CHATBOT = ['Professionnel', 'Premium', 'Groupe'];

function getQuickSuggestions(role: AdminUserRole | null): string[] {
  switch (role) {
    case 'reception':
      return ['Comment assigner une chambre ?', 'Comment signaler un départ ?', 'Comment filtrer par étage ?'];
    case 'gouvernante':
      return ['Comment valider une chambre ?', 'Comment gérer les stocks ?', 'Comment voir les performances ?'];
    case 'femme_de_chambre':
      return ['Comment démarrer le nettoyage ?', 'Comment signaler un problème ?', 'Comment scanner un QR code ?'];
    case 'maintenance':
      return ['Comment prendre en charge une intervention ?', 'Comment résoudre une tâche ?', 'Comment filtrer par priorité ?'];
    case 'breakfast':
      return ['Comment enregistrer un PDJ ?', 'Comment voir le CA ?', 'Comment gérer les stocks PDJ ?'];
    case 'direction':
      return ['Comment voir les KPIs ?', 'Comment générer un rapport ?', 'Comment voir les avis ?'];
    case 'super_admin':
      return ['Comment créer un hôtel ?', 'Comment créer un code promo ?', 'Comment activer le mode support ?'];
    default:
      return ['Comment changer ma langue ?', 'Comment contacter le support ?', 'Comment me déconnecter ?'];
  }
}

function getMessageIcon(type: ChatMessage['type']): React.ReactNode | null {
  switch (type) {
    case 'out_of_scope':
      return <ShieldAlert size={14} color="#F59E0B" />;
    case 'commercial':
      return <Briefcase size={14} color="#3B82F6" />;
    case 'no_match':
      return <AlertTriangle size={14} color="#EF4444" />;
    default:
      return null;
  }
}

function getBubbleAccent(type: ChatMessage['type']): string | null {
  switch (type) {
    case 'out_of_scope':
      return '#F59E0B';
    case 'commercial':
      return '#3B82F6';
    case 'no_match':
      return '#EF4444';
    default:
      return null;
  }
}

function ChatBubble({ msg, colors }: { msg: ChatMessage; colors: ReturnType<typeof useColors> }) {
  const isBot = msg.sender === 'bot';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isBot ? -20 : 20)).current;
  const accent = isBot ? getBubbleAccent(msg.type) : null;
  const icon = isBot ? getMessageIcon(msg.type) : null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isBot ? styles.bubbleRowLeft : styles.bubbleRowRight,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {isBot && (
        <View style={[styles.botAvatar, { backgroundColor: accent ?? '#6B5CE7' }]}>
          {icon ?? <Sparkles size={14} color="#FFFFFF" />}
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isBot
            ? {
                backgroundColor: colors.surfaceAlt,
                borderBottomLeftRadius: 4,
                borderLeftWidth: accent ? 3 : 0,
                borderLeftColor: accent ?? 'transparent',
              }
            : { backgroundColor: '#6B5CE7', borderBottomRightRadius: 4 },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isBot ? colors.text : '#FFFFFF' },
          ]}
        >
          {msg.message}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            { color: isBot ? colors.textMuted : 'rgba(255,255,255,0.6)' },
          ]}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

const MemoizedChatBubble = React.memo(ChatBubble);

function UpgradeMessage({ colors, onClose }: { colors: ReturnType<typeof useColors>; onClose: () => void }) {
  return (
    <View style={[styles.upgradeContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.upgradeHeader}>
        <View style={[styles.upgradeBadge, { backgroundColor: 'rgba(107,92,231,0.1)' }]}>
          <Sparkles size={24} color="#6B5CE7" />
        </View>
        <TouchableOpacity onPress={onClose} style={styles.upgradeClose} testID="chatbot-upgrade-close">
          <X size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.upgradeTitle, { color: colors.text }]}>Assistant FLOWTYM</Text>
      <Text style={[styles.upgradeSubtitle, { color: colors.textSecondary }]}>
        Le chatbot d{"'"}assistance instantanée est disponible dans nos offres Professionnel, Premium et Groupe.
      </Text>
      <View style={styles.upgradeFeatures}>
        {['Réponses instantanées 24/7', 'Guide pas à pas dans l\u2019application', 'Moins d\u2019attente que le support email'].map((feat, i) => (
          <View key={i} style={styles.upgradeFeatureRow}>
            <Text style={styles.upgradeCheck}>✅</Text>
            <Text style={[styles.upgradeFeatureText, { color: colors.text }]}>{feat}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.upgradeButton, { backgroundColor: '#6B5CE7' }]}
        testID="chatbot-upgrade-btn"
      >
        <Text style={styles.upgradeButtonText}>Découvrir les offres</Text>
        <ArrowUpRight size={16} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={[styles.upgradeContact, { color: colors.textMuted }]}>
        Ou contactez : commercial@flowtym.com
      </Text>
    </View>
  );
}

export default function ChatBot() {
  const { currentUser } = useAuth();
  const { hotelSubs, plans } = useSubscriptions();
  const { messages, sendMessage, clearConversation, isOpen, setIsOpen } = useChatbot();
  const colors = useColors();
  useTheme();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const hasAccess = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'support') return true;
    if (!currentUser.hotelId) return false;

    const sub = hotelSubs.find(s => s.hotelId === currentUser.hotelId && (s.status === 'active' || s.status === 'trial'));
    if (!sub) return false;

    const plan = plans.find(p => p.id === sub.planId);
    if (!plan) return false;

    return PLANS_WITH_CHATBOT.includes(plan.name);
  }, [currentUser, hotelSubs, plans]);

  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(modalAnim, { toValue: 1, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      modalAnim.setValue(0);
    }
  }, [isOpen, modalAnim]);

  const handleOpen = useCallback(() => {
    if (!hasAccess) {
      setShowUpgrade(true);
      return;
    }
    setIsOpen(true);
    if (messages.length === 0) {
      setSuggestions(getQuickSuggestions(currentUser?.role ?? null));
    }
  }, [hasAccess, setIsOpen, messages.length, currentUser?.role]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');

    const newSuggestions = sendMessage(trimmed, currentUser?.role ?? null);
    setSuggestions(newSuggestions);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [input, sendMessage, currentUser?.role]);

  const handleSuggestionPress = useCallback((text: string) => {
    setInput('');
    const newSuggestions = sendMessage(text, currentUser?.role ?? null);
    setSuggestions(newSuggestions);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [sendMessage, currentUser?.role]);

  const handleClear = useCallback(() => {
    clearConversation();
    setSuggestions(getQuickSuggestions(currentUser?.role ?? null));
  }, [clearConversation, currentUser?.role]);

  const handleFabPressIn = useCallback(() => {
    Animated.spring(fabScale, { toValue: 0.85, tension: 300, friction: 10, useNativeDriver: true }).start();
  }, [fabScale]);

  const handleFabPressOut = useCallback(() => {
    Animated.spring(fabScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }).start();
  }, [fabScale]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <MemoizedChatBubble msg={item} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  if (!currentUser) return null;

  const welcomeMessage = `Bonjour${currentUser.firstName ? ` ${currentUser.firstName}` : ''} ! 👋\n\nJe suis l'assistant FLOWTYM. Je réponds uniquement aux questions d'utilisation de l'application.\n\nComment puis-je vous aider ?`;

  return (
    <>
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          onPress={handleOpen}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          style={[styles.fabButton, { backgroundColor: '#6B5CE7' }]}
          testID="chatbot-fab"
        >
          <MessageCircle size={24} color="#FFFFFF" fill="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <Modal visible={showUpgrade} transparent animationType="fade" onRequestClose={() => setShowUpgrade(false)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowUpgrade(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <UpgradeMessage colors={colors} onClose={() => setShowUpgrade(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View
            style={[
              styles.chatPanel,
              {
                backgroundColor: colors.background,
                opacity: modalAnim,
                transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').height, 0] }) }],
              },
            ]}
          >
            <View style={[styles.chatHeader, { backgroundColor: '#6B5CE7' }]}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatHeaderAvatar}>
                  <Sparkles size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>Assistant FLOWTYM</Text>
                  <Text style={styles.chatHeaderSubtitle}>Aide à l{"'"}utilisation</Text>
                </View>
              </View>
              <View style={styles.chatHeaderActions}>
                <TouchableOpacity onPress={handleClear} style={styles.chatHeaderBtn} testID="chatbot-clear">
                  <Trash2 size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.chatHeaderBtn} testID="chatbot-close">
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messagesList}
              ListHeaderComponent={
                <View style={styles.welcomeContainer}>
                  <View style={[styles.welcomeBubble, { backgroundColor: colors.surfaceAlt }]}>
                    <View style={[styles.welcomeIcon, { backgroundColor: 'rgba(107,92,231,0.12)' }]}>
                      <Sparkles size={20} color="#6B5CE7" />
                    </View>
                    <Text style={[styles.welcomeText, { color: colors.text }]}>{welcomeMessage}</Text>
                    <View style={[styles.scopeNotice, { backgroundColor: 'rgba(107,92,231,0.08)' }]}>
                      <HelpCircle size={14} color="#6B5CE7" />
                      <Text style={[styles.scopeNoticeText, { color: colors.textSecondary }]}>
                        Je réponds aux questions du type {"\""}Comment faire...{"\""} uniquement.
                      </Text>
                    </View>
                  </View>
                </View>
              }
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
            />

            {suggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { borderTopColor: colors.border }]}>
                <FlatList
                  horizontal
                  data={suggestions}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsScroll}
                  keyExtractor={(item, index) => `sug-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => handleSuggestionPress(item)}
                    >
                      <HelpCircle size={12} color="#6B5CE7" />
                      <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>{item}</Text>
                      <ChevronRight size={12} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Comment faire pour..."
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline={false}
                testID="chatbot-input"
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: input.trim() ? '#6B5CE7' : colors.border }]}
                onPress={handleSend}
                disabled={!input.trim()}
                testID="chatbot-send"
              >
                <Send size={18} color={input.trim() ? '#FFFFFF' : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    zIndex: 1000,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  chatPanel: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  welcomeContainer: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  welcomeBubble: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  welcomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 22,
  },
  scopeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  scopeNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
    paddingRight: 40,
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%' as any,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right' as const,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: 260,
  },
  suggestionText: {
    fontSize: 12,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeContainer: {
    borderRadius: 20,
    padding: 24,
    width: Dimensions.get('window').width - 48,
    maxWidth: 400,
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  upgradeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  upgradeFeatures: {
    gap: 10,
    marginBottom: 20,
  },
  upgradeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeCheck: {
    fontSize: 14,
  },
  upgradeFeatureText: {
    fontSize: 14,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  upgradeContact: {
    fontSize: 12,
    textAlign: 'center' as const,
  },
});

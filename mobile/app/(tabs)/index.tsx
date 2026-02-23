import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Config } from '../../constants/Config';
import { sendChat } from '../../lib/api';
import { Message, Category } from '../../types';
import { ChatMessage } from '../../components/ChatMessage';
import { CategoryButton } from '../../components/CategoryButton';

const CATEGORIES: Category[] = [
  {
    id: 'anxiety',
    label: 'Anxiety & Worry',
    icon: 'heart-outline',
    prompt: 'What does the Bible say about dealing with anxiety and worry?',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    icon: 'people-outline',
    prompt: 'What biblical wisdom applies to building healthy relationships?',
  },
  {
    id: 'purpose',
    label: 'Life Purpose',
    icon: 'compass-outline',
    prompt: "How can I find God's purpose for my life according to Scripture?",
  },
  {
    id: 'forgiveness',
    label: 'Forgiveness',
    icon: 'hand-left-outline',
    prompt: 'What does the Bible teach about forgiveness?',
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: 'wallet-outline',
    prompt: 'What biblical principles apply to managing money and finances?',
  },
  {
    id: 'grief',
    label: 'Grief & Loss',
    icon: 'leaf-outline',
    prompt: 'What comfort does Scripture offer for those going through grief?',
  },
];

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  const inChat = messages.length > 0;

  const handleSend = useCallback(
    async (text?: string) => {
      const prompt = (text || input).trim();
      if (!prompt || loading) return;

      setInput('');

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await sendChat(prompt, conversationId);

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Something went wrong.');
        // Remove the user message if the request failed
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setLoading(false);
      }
    },
    [input, loading, conversationId]
  );

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput('');
  };

  const handleCategoryPress = (category: Category) => {
    handleSend(category.prompt);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Config.APP_NAME}</Text>
        {inChat && (
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtn}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {inChat ? (
        /* Chat View */
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatMessage message={item} />}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListFooterComponent={
              loading ? (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>ADONAI GUIDE is thinking...</Text>
                </View>
              ) : null
            }
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask for biblical wisdom..."
              placeholderTextColor={Colors.placeholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* Home View - Categories */
        <View style={styles.homeContainer}>
          <Text style={styles.welcomeTitle}>
            What's on your heart today?
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Choose a topic or ask your own question
          </Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <CategoryButton
                key={cat.id}
                category={cat}
                onPress={handleCategoryPress}
              />
            ))}
          </View>

          {/* Custom Question Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Or type your own question..."
              placeholderTextColor={Colors.placeholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
  },
  newChatBtn: {
    position: 'absolute',
    right: 20,
  },
  // Home view
  homeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    flex: 1,
  },
  // Chat view
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  typingText: {
    color: Colors.textSecondary,
    marginLeft: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && <Text style={styles.senderLabel}>ADONAI GUIDE</Text>}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 3,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: Colors.userBubble,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.assistantBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: Colors.text,
  },
  assistantText: {
    color: Colors.text,
  },
});

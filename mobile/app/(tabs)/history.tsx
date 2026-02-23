import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../providers/AuthProvider';
import { getConversations, deleteConversation } from '../../lib/api';
import { Conversation } from '../../types';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadConversations();
      }
    }, [user])
  );

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error: any) {
      Alert.alert('Error', 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
              setConversations((prev) => prev.filter((c) => c.id !== id));
            } catch {
              Alert.alert('Error', 'Could not delete conversation.');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sign in to view history</Text>
          <Text style={styles.emptySubtitle}>
            Your conversations will be saved when you sign in.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <View style={styles.conversationItem}>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.conversationDate}>{formatDate(item.updated_at)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.title)}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a chat and your conversations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

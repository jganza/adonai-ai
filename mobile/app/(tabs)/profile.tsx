import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Config } from '../../constants/Config';
import { useAuth } from '../../providers/AuthProvider';
import { getProfile } from '../../lib/api';
import { UserProfile } from '../../types';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfile();
      }
    }, [user])
  );

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      // Profile loading failed silently - user info from auth still available
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/sign-in');
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-outline" size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.guestTitle}>Guest User</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to save conversations and track your usage.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {loading && !profile ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || user.email || '?')[0].toUpperCase()}
            </Text>
          </View>

          <Text style={styles.displayName}>
            {profile?.display_name || 'User'}
          </Text>
          <Text style={styles.email}>{user.email}</Text>

          {/* Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Plan</Text>
              <Text style={styles.statValue}>
                {profile?.tier === 'premium' ? 'Premium' : 'Free'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Questions Today</Text>
              <Text style={styles.statValue}>
                {profile?.daily_question_count ?? 0} / {Config.DAILY_FREE_LIMIT}
              </Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>{Config.APP_NAME} v1.0.0</Text>
        <Text style={styles.appInfoText}>Biblical Wisdom for Modern Life</Text>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 30,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  signInButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 30,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
});

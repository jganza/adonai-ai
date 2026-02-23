import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { Colors } from '../../constants/Colors';
import { Config } from '../../constants/Config';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', friendlyError(error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.appName}>{Config.APP_NAME}</Text>
        <Text style={styles.subtitle}>Biblical Wisdom for Modern Life</Text>

        <View style={styles.form}>
          <Text style={styles.title}>Sign In</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" style={styles.link}>
              <Text style={styles.linkText}>Sign Up</Text>
            </Link>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.skipText}>Continue without account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and confirm your account first.';
  }
  return message;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: {
    marginLeft: 0,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

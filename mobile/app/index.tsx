import { Redirect } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

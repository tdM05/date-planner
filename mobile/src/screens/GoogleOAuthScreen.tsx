import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useNavigation } from '@react-navigation/native';

// Important: Tell WebBrowser to handle OAuth redirects
WebBrowser.maybeCompleteAuthSession();

export const GoogleOAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initiateOAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the Google OAuth URL from backend
      const authUrl = await authAPI.getGoogleAuthUrl();

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'dateplanner://oauth/callback'
      );

      if (result.type === 'success' && result.url) {
        // Extract token from callback URL
        // The backend should redirect to: dateplanner://oauth/callback?token=<jwt_token>
        const url = new URL(result.url);
        const token = url.searchParams.get('token');

        if (token) {
          await setToken(token);
          // Navigation will happen automatically
        } else {
          setError('No token received from OAuth callback');
        }
      } else if (result.type === 'cancel') {
        navigation.goBack();
      }
    } catch (err: any) {
      setError(err.message || 'OAuth failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initiateOAuth();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Authentication failed
        </Text>
        <Text variant="bodyMedium">{error}</Text>
        <Snackbar
          visible={!!error}
          onDismiss={() => {
            setError(null);
            navigation.goBack();
          }}
          duration={3000}
        >
          {error}
        </Snackbar>
      </View>
    );
  }

  return <LoadingSpinner message="Authenticating with Google..." />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 8,
    color: '#d32f2f',
  },
});

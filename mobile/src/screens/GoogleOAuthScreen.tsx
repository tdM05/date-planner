import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
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

      const platform = Platform.OS === 'web' ? 'web' : 'mobile';
      console.log('[GoogleOAuth] Starting OAuth flow for platform:', platform);

      // Get the Google OAuth URL from backend with platform parameter
      const authUrl = await authAPI.getGoogleAuthUrl(platform);
      console.log('[GoogleOAuth] Got auth URL:', authUrl);

      if (Platform.OS === 'web') {
        // On web, redirect to the OAuth URL directly
        console.log('[GoogleOAuth] Redirecting to OAuth URL on web...');
        window.location.href = authUrl;
        return;
      }

      // On mobile, open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'dateplanner://oauth/callback'
      );

      console.log('[GoogleOAuth] WebBrowser result:', result);

      if (result.type === 'success' && result.url) {
        console.log('[GoogleOAuth] Success! Callback URL:', result.url);
        // Extract token from callback URL
        // The backend should redirect to: dateplanner://oauth/callback?token=<jwt_token>
        const url = new URL(result.url);
        const token = url.searchParams.get('token');

        if (token) {
          console.log('[GoogleOAuth] Token extracted, setting...');
          await setToken(token);
          // Navigation will happen automatically
        } else {
          console.error('[GoogleOAuth] No token in URL. URL params:', url.searchParams.toString());
          setError('No token received from OAuth callback');
        }
      } else if (result.type === 'cancel') {
        console.log('[GoogleOAuth] User cancelled');
        navigation.goBack();
      } else {
        console.log('[GoogleOAuth] Unexpected result type:', result.type);
        setError(`OAuth flow ended with type: ${result.type}`);
      }
    } catch (err: any) {
      console.error('[GoogleOAuth] Error:', err);
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Authentication Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>Please try again or go back</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Authenticating with Google...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5E6F8',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
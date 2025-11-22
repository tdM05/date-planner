import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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

      // For web, pass the current origin as redirect URL for dynamic routing
      let redirectUrl: string | undefined;
      if (Platform.OS === 'web') {
        redirectUrl = window.location.origin;
        console.log('[GoogleOAuth] Using redirect URL:', redirectUrl);
      }

      // Get the Google OAuth URL from backend with platform and redirect URL
      const authUrl = await authAPI.getGoogleAuthUrl(platform, redirectUrl);
      console.log('[GoogleOAuth] Got auth URL:', authUrl);

      if (Platform.OS === 'web') {
        // On web, redirect to the OAuth URL directly
        console.log('[GoogleOAuth] Redirecting to OAuth URL on web...');
        window.location.href = authUrl;
        return;
      }

      // On mobile, open browser for OAuth and wait for deep link callback
      console.log('[GoogleOAuth] Opening browser with URL:', authUrl);
      await WebBrowser.openBrowserAsync(authUrl);

      // The browser will redirect to dateplanner://oauth/callback?code=xxx&state=yyy
      // and our app will handle it via deep linking in the useEffect below
    } catch (err: any) {
      console.error('[GoogleOAuth] Error:', err);
      setError(err.message || 'OAuth failed');
      setIsLoading(false);
    }
  };

  // Set up deep link listener for OAuth callback on mobile
  useEffect(() => {
    if (Platform.OS === 'web') {
      initiateOAuth();
      return;
    }

    // Mobile deep link handling
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[GoogleOAuth] Deep link received:', event.url);

      try {
        const url = new URL(event.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const errorParam = url.searchParams.get('error');

        if (errorParam) {
          console.error('[GoogleOAuth] Error from OAuth:', errorParam);
          setError(decodeURIComponent(errorParam));
          setIsLoading(false);
          return;
        }

        if (code && state) {
          console.log('[GoogleOAuth] Exchanging code for token...');
          // Exchange code for token via backend
          const response = await authAPI.exchangeGoogleOAuthCode(code, state);
          console.log('[GoogleOAuth] Token received, setting...');
          await setToken(response.access_token);
          // Navigation will happen automatically
        } else {
          console.error('[GoogleOAuth] Missing code or state in deep link');
          setError('OAuth callback missing required parameters');
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('[GoogleOAuth] Error handling deep link:', err);
        setError(err.message || 'Failed to process OAuth callback');
        setIsLoading(false);
      }
    };

    // Add deep link listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Start OAuth flow
    initiateOAuth();

    // Cleanup
    return () => {
      subscription.remove();
    };
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
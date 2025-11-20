import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store';

export const OAuthCallbackScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[OAuthCallback] Processing OAuth callback...');
        console.log('[OAuthCallback] Current URL:', window.location.href);

        // Extract parameters from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const success = params.get('success');
        const errorParam = params.get('error');

        console.log('[OAuthCallback] Params:', { token: !!token, success, error: errorParam });

        if (errorParam) {
          setError(decodeURIComponent(errorParam.replace(/\+/g, ' ')));
          console.error('[OAuthCallback] OAuth error:', errorParam);
          setTimeout(() => navigation.navigate('Welcome' as never), 3000);
          return;
        }

        if (token) {
          console.log('[OAuthCallback] Token received, setting...');
          await setToken(token);
          console.log('[OAuthCallback] Token set successfully, will navigate to Home');
          // Navigation will happen automatically when auth state updates
        } else if (success === 'true') {
          console.log('[OAuthCallback] Calendar connected successfully');
          setTimeout(() => navigation.navigate('Settings' as never), 1000);
        } else {
          setError('No token or success parameter received');
          console.error('[OAuthCallback] Missing expected parameters');
          setTimeout(() => navigation.navigate('Welcome' as never), 3000);
        }
      } catch (err: any) {
        console.error('[OAuthCallback] Error processing callback:', err);
        setError(err.message || 'Failed to process OAuth callback');
        setTimeout(() => navigation.navigate('Welcome' as never), 3000);
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Authentication Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>Redirecting back...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Completing authentication...</Text>
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

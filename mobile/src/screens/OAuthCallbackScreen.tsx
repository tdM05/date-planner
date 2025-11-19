import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store';
import { LoadingSpinner } from '../components/LoadingSpinner';

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
        <Text variant="headlineMedium" style={styles.errorText}>
          Authentication Failed
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {error}
        </Text>
        <Text variant="bodySmall" style={styles.redirectText}>
          Redirecting...
        </Text>
      </View>
    );
  }

  return <LoadingSpinner message="Completing authentication..." />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorDetail: {
    marginBottom: 8,
    textAlign: 'center',
  },
  redirectText: {
    marginTop: 16,
    color: '#666',
  },
});

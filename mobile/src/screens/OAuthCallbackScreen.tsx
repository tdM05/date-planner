import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; // Added useRoute
import { useAuthStore } from '../store';

export const OAuthCallbackScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Get the route to access params on mobile
  const { setToken } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[OAuthCallback] Processing OAuth callback...');

        let token, success, errorParam;

        // ---------------------------------------------------------
        // PLATFORM SPECIFIC PARAM EXTRACTION
        // ---------------------------------------------------------
        if (Platform.OS === 'web') {
          // Web: Read from browser URL
          const params = new URLSearchParams(window.location.search);
          token = params.get('token');
          success = params.get('success');
          errorParam = params.get('error');
        } else {
          // Mobile: Read from React Navigation Route Params
          // The deep link `dateplanner://oauth/callback?token=xyz`
          // is automatically parsed into this object by React Navigation.
          const params = route.params as { token?: string; success?: string; error?: string } || {};
          token = params.token;
          success = params.success;
          errorParam = params.error;
        }
        // ---------------------------------------------------------

        console.log('[OAuthCallback] Params:', { token: !!token, success, error: errorParam });

        if (errorParam) {
          setError(decodeURIComponent(errorParam.replace(/\+/g, ' ')));
          setTimeout(() => navigation.navigate('Welcome' as never), 3000);
          return;
        }

        if (token) {
          await setToken(token);

          if (Platform.OS === 'web') {
            window.history.replaceState({}, '', '/');
          }

          // Success! Reset to Main Tabs
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' as never }],
          });
        } else if (success === 'true') {
          // Calendar connected successfully
          navigation.reset({
            index: 0,
            routes: [{
              name: 'MainTabs' as never,
              params: { screen: 'Profile' } // Go back to profile
            }],
          });
        } else {
          setError('No token received');
          setTimeout(() => navigation.navigate('Welcome' as never), 3000);
        }
      } catch (err: any) {
        console.error('[OAuthCallback] Error:', err);
        setError(err.message || 'Callback failed');
        setTimeout(() => navigation.navigate('Welcome' as never), 3000);
      }
    };

    handleCallback();
  }, [route.params]);

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
        <Text style={styles.loadingText}>Finalizing login...</Text>
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

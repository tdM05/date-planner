import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore, useCoupleStore } from '../store';
import {
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
  GoogleOAuthScreen,
  OAuthCallbackScreen,
  DateGeneratorScreen,
  ResultsScreen,
} from '../screens';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Stack = createNativeStackNavigator();

// Linking configuration for web URLs
const linking = {
  prefixes: ['https://', 'http://', 'dateplanner://'],
  config: {
    screens: {
      Welcome: '',
      Login: 'login',
      Register: 'register',
      GoogleOAuth: 'google-oauth',
      OAuthCallback: 'oauth/callback',
      MainTabs: {
        path: 'app',
        screens: {
          Home: 'home',
          Schedule: 'schedule',
          Dates: 'dates',
          Profile: 'profile',
        },
      },
      DateGenerator: 'date-generator',
      Results: 'results',
    },
  },
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const { reset: resetCouple } = useCoupleStore();

  // Load stored authentication on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Reset couple store on logout
  useEffect(() => {
    if (!isAuthenticated) {
      resetCouple();
    }
  }, [isAuthenticated]);

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack - Not logged in
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GoogleOAuth"
              component={GoogleOAuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OAuthCallback"
              component={OAuthCallbackScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main Stack - Logged in
          <>

            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DateGenerator"
              component={DateGeneratorScreen}
              options={{ title: 'Plan a Date' }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: 'Date Suggestions' }}
            />
            <Stack.Screen
              name="OAuthCallback"
              component={OAuthCallbackScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
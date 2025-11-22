import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCoupleStore } from '../store';

export const AcceptInvitationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { acceptInvitation, isLoading, error, clearError } = useCoupleStore();

  const [token, setToken] = useState('');

  const handleAccept = async () => {
    try {
      await acceptInvitation(token);
      // Navigate to main tabs after successful acceptance
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          💕 Accept Invitation 💕
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter the invitation code your partner shared with you
        </Text>

        <TextInput
          label="Invitation Code"
          value={token}
          onChangeText={setToken}
          mode="outlined"
          autoCapitalize="characters"
          style={styles.input}
          disabled={isLoading}
        />

        <Button
          mode="contained"
          onPress={handleAccept}
          loading={isLoading}
          disabled={isLoading || !token.trim()}
          style={styles.button}
        >
          Accept Invitation
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          style={styles.backButton}
        >
          Back
        </Button>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={3000}
      >
        {error || ''}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6F8',
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    color: '#EC4899',
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#A855F7',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  backButton: {
    marginTop: 16,
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useCoupleStore } from '../store';

export const InvitePartnerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { invitePartner, invitation, isLoading, error, clearError } = useCoupleStore();

  const [email, setEmail] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const handleInvite = async () => {
    try {
      await invitePartner(email);
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleShare = async () => {
    if (!invitation) return;

    try {
      await Share.share({
        message: `Join me on Date Planner! Use this code to connect: ${invitation.token}\n\nExpires: ${new Date(invitation.expires_at).toLocaleDateString()}`,
        title: 'Date Planner Invitation',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!invitation) return;
    try {
      await Clipboard.setStringAsync(invitation.token);
      setCopyMessage('💕 Code copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      setCopyMessage('Failed to copy code');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!invitation ? (
        // Invite form
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            💕 Invite Your Partner 💕
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter your partner's email to send them an invitation
          </Text>

          <TextInput
            label="Partner's Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            disabled={isLoading}
          />

          <Button
            mode="contained"
            onPress={handleInvite}
            loading={isLoading}
            disabled={isLoading || !email.trim()}
            style={styles.button}
          >
            Send Invitation
          </Button>
        </View>
      ) : (
        // Invitation created
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            💝 Invitation Sent! 💝
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                💕 Invitation Code 💕
              </Text>
              <Text variant="bodyLarge" style={styles.code}>
                {invitation.token}
              </Text>
              <Text variant="bodySmall" style={styles.expiry}>
                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={handleCopyCode}>Copy Code</Button>
              <Button onPress={handleShare}>Share</Button>
            </Card.Actions>
          </Card>

          <Text variant="bodyMedium" style={styles.instructions}>
            Share this code with your partner. They can use it to accept your invitation and link your accounts.
          </Text>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Done
          </Button>
        </View>
      )}

      <Snackbar
        visible={!!error || !!copyMessage}
        onDismiss={() => {
          clearError();
          setCopyMessage(null);
        }}
        duration={3000}
      >
        {error || copyMessage || ''}
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
  card: {
    marginVertical: 16,
    backgroundColor: '#FFF5FB',
    borderWidth: 2,
    borderColor: '#FDE2F3',
  },
  cardTitle: {
    marginBottom: 8,
    color: '#EC4899',
    fontWeight: '600',
  },
  code: {
    fontWeight: 'bold',
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#EC4899',
    color: '#EC4899',
    fontSize: 18,
  },
  expiry: {
    color: '#A855F7',
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
});

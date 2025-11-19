import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useCoupleStore } from '../store';

export const InvitePartnerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { invitePartner, invitation, isLoading, error, clearError } = useCoupleStore();

  const [email, setEmail] = useState('');

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
    // In a real app, you'd use Clipboard API
    // For now, we'll just show a snackbar
    alert(`Code copied: ${invitation.token}`);
  };

  return (
    <ScrollView style={styles.container}>
      {!invitation ? (
        // Invite form
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            Invite Your Partner
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter your partner's email to send them an invitation.
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
            Invitation Sent!
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Invitation Code
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  card: {
    marginVertical: 16,
  },
  cardTitle: {
    marginBottom: 8,
  },
  code: {
    fontWeight: 'bold',
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    textAlign: 'center',
  },
  expiry: {
    color: '#999',
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
});

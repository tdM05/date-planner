import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share, TouchableOpacity, Text, TextInput as RNTextInput } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useCoupleStore } from '../store';

export const InvitePartnerScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { invitePartner, invitation, isLoading, error, clearError, clearInvitation } = useCoupleStore();

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
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#F9A8D4', '#F5E6F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>
          {invitation ? 'Invitation Sent!' : 'Invite Your Partner'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {invitation ? 'Share this code to connect' : 'Send an invitation to connect'}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {!invitation ? (
          // Invite form
          <View style={styles.card}>
            <Text style={styles.label}>Partner's Email</Text>
            <RNTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="partner@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.inviteButton, (isLoading || !email.trim()) && styles.inviteButtonDisabled]}
              onPress={handleInvite}
              disabled={isLoading || !email.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(isLoading || !email.trim()) ? ['#D1D5DB', '#D1D5DB'] : ['#EC4899', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.inviteButtonText}>
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // Invitation created
          <>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Invitation Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.code} numberOfLines={3} adjustsFontSizeToFit>
                  {invitation.token}
                </Text>
              </View>
              <Text style={styles.expiry}>
                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <View style={styles.actionButtonInner}>
                  <Text style={styles.actionButtonIcon}>📋</Text>
                  <Text style={styles.actionButtonText}>Copy Code</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <View style={styles.actionButtonInner}>
                  <Text style={styles.actionButtonIcon}>📤</Text>
                  <Text style={styles.actionButtonText}>Share</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.instructions}>
              Share this code with your partner. They can use it to accept your invitation and link your accounts.
            </Text>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                clearInvitation();
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Snackbar
        visible={!!error || !!copyMessage}
        onDismiss={() => {
          clearError();
          setCopyMessage(null);
        }}
        duration={3000}
        style={styles.snackbar}
      >
        {error || copyMessage || ''}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  inviteButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  codeCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  codeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  code: {
    fontWeight: '700',
    fontSize: 20,
    color: '#EC4899',
    textAlign: 'center',
    letterSpacing: 1,
    flexWrap: 'wrap',
  },
  expiry: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonInner: {
    padding: 16,
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  doneButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  snackbar: {
    backgroundColor: '#EC4899',
  },
});

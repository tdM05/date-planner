import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Text, Modal } from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useCoupleStore } from '../store';
import { authAPI } from '../api';

WebBrowser.maybeCompleteAuthSession();

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { partner, calendarStatus, fetchCalendarStatus } = useCoupleStore();

  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchCalendarStatus();
  }, []);

  const handleConnectCalendar = async () => {
    if (!user) return;

    try {
      setIsConnectingCalendar(true);

      const platform = Platform.OS === 'web' ? 'web' : 'mobile';
      console.log('[Settings] Connecting calendar for platform:', platform);

      // Get OAuth URL for calendar connection (backend uses JWT to identify user)
      const authUrl = await authAPI.getGoogleAuthUrl(platform);
      console.log('[Settings] Got OAuth URL:', authUrl);

      if (Platform.OS === 'web') {
        // On web, redirect to the OAuth URL directly
        console.log('[Settings] Redirecting to OAuth URL on web...');
        window.location.href = authUrl;
        return;
      }

      // On mobile, open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'dateplanner://oauth/callback'
      );

      if (result.type === 'success') {
        setMessage('Calendar connected successfully!');
        // Refresh calendar status
        await fetchCalendarStatus();
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to connect calendar');
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    console.log('[Settings] User confirmed logout');
    setShowLogoutConfirm(false);
    await logout();
    console.log('[Settings] Logout complete');
    // Navigation will happen automatically
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
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
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your account and preferences
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{user?.full_name || 'Unknown'}</Text>
              <Text style={styles.cardDescription}>{user?.email || ''}</Text>
            </View>
          </View>
        </View>

        {/* Partner Card */}
        {partner && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>💕</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>
                  {partner.full_name || 'Partner'}
                </Text>
                <Text style={styles.cardDescription}>
                  {partner.email || 'Connected'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Calendar Section */}
        <Text style={styles.sectionTitle}>Google Calendar</Text>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusIcon}>📅</Text>
              <View>
                <Text style={styles.statusTitle}>Your Calendar</Text>
                <Text style={styles.statusDescription}>
                  {calendarStatus?.user_connected ? 'Connected' : 'Not connected'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, calendarStatus?.user_connected && styles.statusBadgeConnected]}>
              <Text style={[styles.statusBadgeText, calendarStatus?.user_connected && styles.statusBadgeTextConnected]}>
                {calendarStatus?.user_connected ? '✓' : '○'}
              </Text>
            </View>
          </View>

          {partner && (
            <View style={[styles.statusRow, { marginTop: 16 }]}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusIcon}>💗</Text>
                <View>
                  <Text style={styles.statusTitle}>Partner's Calendar</Text>
                  <Text style={styles.statusDescription}>
                    {calendarStatus?.partner_connected ? 'Connected' : 'Not connected'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, calendarStatus?.partner_connected && styles.statusBadgeConnected]}>
                <Text style={[styles.statusBadgeText, calendarStatus?.partner_connected && styles.statusBadgeTextConnected]}>
                  {calendarStatus?.partner_connected ? '✓' : '○'}
                </Text>
              </View>
            </View>
          )}

          {!calendarStatus?.user_connected && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectCalendar}
              disabled={isConnectingCalendar}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#EC4899', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.connectButtonText}>
                  {isConnectingCalendar ? 'Connecting...' : 'Connect Your Calendar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={handleLogoutCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleLogoutCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleLogoutConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {message || ''}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeConnected: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statusBadgeTextConnected: {
    color: '#10B981',
  },
  connectButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 16,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  snackbar: {
    backgroundColor: '#EC4899',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

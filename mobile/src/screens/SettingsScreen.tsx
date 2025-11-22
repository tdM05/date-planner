import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Text, Modal } from 'react-native';
import { Snackbar } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useCoupleStore } from '../store';
import { authAPI } from '../api';
import { User, Calendar, UserPlus, ArrowLeft } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<any>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { partner, hasCouple, calendarStatus, fetchCalendarStatus } = useCoupleStore();

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

      const authUrl = await authAPI.getGoogleAuthUrl(platform);
      console.log('[Settings] Got OAuth URL:', authUrl);

      if (Platform.OS === 'web') {
        console.log('[Settings] Redirecting to OAuth URL on web...');
        window.location.href = authUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'dateplanner://oauth/callback'
      );

      if (result.type === 'success') {
        setMessage('Calendar connected successfully!');
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
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile & Settings</Text>
        
        {/* User Profile Card with Icon */}
        <View style={styles.profileCard}>
          <User size={20} color="#6B7280" style={styles.userIcon} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileStatus}>
              {hasCouple ? 'Coupled profile' : 'Single profile'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* User & Partner Cards Side by Side */}
        <View style={styles.section}>
          <View style={styles.profileCardsContainer}>
            {/* User Card */}
            <View style={styles.profileCardSmall}>
              <View style={[styles.avatarCircleSmall, styles.userAvatar]}>
                <Text style={styles.avatarTextSmall}>
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.profileNameSmall}>Me</Text>
            </View>

            {/* Partner Card */}
            {hasCouple && partner ? (
              <View style={styles.profileCardSmall}>
                <View style={[styles.avatarCircleSmall, styles.partnerAvatarSmall]}>
                  <Text style={styles.avatarTextSmall}>
                    {partner?.full_name?.charAt(0).toUpperCase() || 'P'}
                  </Text>
                </View>
                <Text style={styles.profileNameSmall}>{partner?.full_name?.split(' ')[0]}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.profileCardSmall}
                onPress={() => navigation.navigate('InvitePartner')}
                activeOpacity={0.7}
              >
                <View style={[styles.avatarCircleSmall, styles.emptyAvatarSmall]}>
                  <UserPlus size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.profileNameEmpty}>Invite Partner</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Calendar Section */}
        <Text style={styles.sectionTitle}>Google Calendar</Text>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={styles.statusIconContainer}>
                <Calendar size={20} color="#6B7280" />
              </View>
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
                <View style={styles.statusIconContainer}>
                  <Calendar size={20} color="#6B7280" />
                </View>
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
                colors={['#e780b3ff', '#e79f2cff']}
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
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 20,
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
  },
  userIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  profileStatus: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  profileCardsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  profileCardSmall: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    backgroundColor: '#73b4caff',
  },
  partnerAvatarSmall: {
    backgroundColor: '#afa4d6ff',
  },
  emptyAvatarSmall: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  avatarTextSmall: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileNameEmpty: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyPartnerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyPartnerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inviteButton: {
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  statusIconContainer: {
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
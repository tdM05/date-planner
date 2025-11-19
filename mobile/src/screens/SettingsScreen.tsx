import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Button, Divider, Snackbar } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, useCoupleStore } from '../store';
import { authAPI } from '../api';

WebBrowser.maybeCompleteAuthSession();

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { partner, calendarStatus, fetchCalendarStatus } = useCoupleStore();

  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarStatus();
  }, []);

  const handleConnectCalendar = async () => {
    if (!user) return;

    try {
      setIsConnectingCalendar(true);

      // Get OAuth URL with user_id for existing users
      const authUrl = await authAPI.getGoogleAuthUrl(user.id);

      // Open browser for OAuth
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation will happen automatically
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <List.Section>
        <List.Subheader>Profile</List.Subheader>
        <List.Item
          title={user?.full_name || 'Unknown'}
          description={user?.email || ''}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
      </List.Section>

      <Divider />

      {/* Partner Section */}
      {partner && (
        <>
          <List.Section>
            <List.Subheader>Partner</List.Subheader>
            <List.Item
              title={partner.full_name}
              description={partner.email}
              left={(props) => <List.Icon {...props} icon="heart" />}
            />
          </List.Section>
          <Divider />
        </>
      )}

      {/* Calendar Section */}
      <List.Section>
        <List.Subheader>Google Calendar</List.Subheader>
        <List.Item
          title="Your Calendar"
          description={
            calendarStatus?.user_calendar_connected
              ? 'Connected'
              : 'Not connected'
          }
          left={(props) => <List.Icon {...props} icon="calendar" />}
          right={(props) =>
            calendarStatus?.user_calendar_connected ? (
              <List.Icon {...props} icon="check-circle" color="#4CAF50" />
            ) : (
              <List.Icon {...props} icon="alert-circle" color="#FF9800" />
            )
          }
        />

        {partner && (
          <List.Item
            title="Partner's Calendar"
            description={
              calendarStatus?.partner_calendar_connected
                ? 'Connected'
                : 'Not connected'
            }
            left={(props) => <List.Icon {...props} icon="calendar-heart" />}
            right={(props) =>
              calendarStatus?.partner_calendar_connected ? (
                <List.Icon {...props} icon="check-circle" color="#4CAF50" />
              ) : (
                <List.Icon {...props} icon="alert-circle" color="#FF9800" />
              )
            }
          />
        )}

        {!calendarStatus?.user_calendar_connected && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleConnectCalendar}
              loading={isConnectingCalendar}
              disabled={isConnectingCalendar}
              icon="google"
              style={styles.button}
            >
              Connect Your Calendar
            </Button>
          </View>
        )}
      </List.Section>

      <Divider />

      {/* App Info */}
      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
      </List.Section>

      <Divider />

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor="#d32f2f"
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage(null)}
        duration={3000}
      >
        {message || ''}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    marginVertical: 4,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 16,
  },
  logoutButton: {
    borderColor: '#d32f2f',
  },
});

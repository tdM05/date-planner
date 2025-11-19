import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useCoupleStore } from '../store';
import { LoadingSpinner } from '../components/LoadingSpinner';

type NavigationProp = NativeStackNavigationProp<any>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const {
    partner,
    hasCouple,
    calendarStatus,
    fetchPartner,
    fetchCalendarStatus,
    isLoading,
  } = useCoupleStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchPartner(), fetchCalendarStatus()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading && !partner && !calendarStatus) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineMedium">
          {hasCouple && partner
            ? `Hi ${user?.full_name} & ${partner.full_name}!`
            : `Hi ${user?.full_name}!`}
        </Text>
      </View>

      {!hasCouple ? (
        // No couple state
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Find Your Partner
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              To start planning dates, you need to connect with your partner.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('InvitePartner')}
              style={styles.cardButton}
            >
              Invite Partner
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('AcceptInvitation')}
              style={styles.cardButton}
            >
              Have a Code?
            </Button>
          </Card.Actions>
        </Card>
      ) : (
        // Has couple state
        <>
          {/* Calendar Status Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Calendar Status
              </Text>
              <View style={styles.statusRow}>
                <Text>Your Calendar:</Text>
                <Chip
                  mode="outlined"
                  selected={!!calendarStatus?.user_calendar_connected}
                  style={styles.chip}
                >
                  {calendarStatus?.user_calendar_connected ? 'Connected' : 'Not Connected'}
                </Chip>
              </View>
              <View style={styles.statusRow}>
                <Text>Partner's Calendar:</Text>
                <Chip
                  mode="outlined"
                  selected={!!calendarStatus?.partner_calendar_connected}
                  style={styles.chip}
                >
                  {calendarStatus?.partner_calendar_connected ? 'Connected' : 'Not Connected'}
                </Chip>
              </View>
            </Card.Content>
            {(!calendarStatus?.user_calendar_connected ||
              !calendarStatus?.partner_calendar_connected) && (
              <Card.Actions>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Settings')}
                >
                  Connect Calendar
                </Button>
              </Card.Actions>
            )}
          </Card>

          {/* Plan a Date Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Ready to Plan?
              </Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                Generate AI-powered date suggestions based on your schedules.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('DateGenerator')}
                icon="heart"
                style={styles.planButton}
                disabled={
                  !calendarStatus?.user_calendar_connected ||
                  !calendarStatus?.partner_calendar_connected
                }
              >
                Plan a Date
              </Button>
            </Card.Actions>
          </Card>

          {(!calendarStatus?.user_calendar_connected ||
            !calendarStatus?.partner_calendar_connected) && (
            <Text variant="bodySmall" style={styles.hint}>
              Both partners need to connect their calendars to generate date plans.
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardText: {
    color: '#666',
    marginBottom: 16,
  },
  cardButton: {
    marginHorizontal: 4,
  },
  planButton: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  chip: {
    marginLeft: 8,
  },
  hint: {
    textAlign: 'center',
    color: '#999',
    marginHorizontal: 20,
    marginTop: -8,
  },
});

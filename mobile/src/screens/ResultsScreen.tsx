import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Divider, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDateStore } from '../store';
import { format, parseISO, addHours } from 'date-fns';
import { calendarAPI } from '../api';

type NavigationProp = NativeStackNavigationProp<any>;

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { datePlan, clearDatePlan } = useDateStore();
  const [message, setMessage] = useState<string | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  const handleAddVenueToCalendar = async (event: any) => {
    try {
      setIsAddingToCalendar(true);

      // Parse the suggested time and create a 2-hour event
      const startTime = parseISO(event.suggested_time);
      const endTime = addHours(startTime, 2);

      // Add event to Google Calendar
      await calendarAPI.addEvent({
        summary: `Date: ${event.name}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: event.address || undefined,
        description: event.reason,
      });

      setMessage(`💕 "${event.name}" added to your calendar!`);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to add to calendar. Please connect your calendar in Settings.';
      setMessage(errorMsg);
    } finally {
      setIsAddingToCalendar(false);
    }
  };


  if (!datePlan) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge">No date plan available</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Generate a Date Plan
        </Button>
      </View>
    );
  }

  const handleGenerateNew = () => {
    clearDatePlan();
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          💕 Your Date Options 💕
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          We found {datePlan.events.length} great options for you!
        </Text>
      </View>

      {/* Date Event Suggestions */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          💝 Recommended Venues
        </Text>
        {datePlan.events.map((event, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleLarge" style={styles.venueName}>{event.name}</Text>
                <Chip mode="outlined" style={styles.chip}>💕 #{index + 1}</Chip>
              </View>

              {event.address && (
                <Text variant="bodySmall" style={styles.address}>
                  {event.address}
                </Text>
              )}

              <Text variant="bodyMedium" style={styles.reason}>
                {event.reason}
              </Text>

              <View style={styles.timeContainer}>
                <Text variant="labelMedium">Suggested Time:</Text>
                <Text variant="bodyMedium" style={styles.time}>
                  {format(parseISO(event.suggested_time), 'EEE, MMM d, yyyy \'at\' h:mm a')}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => handleAddVenueToCalendar(event)}
                disabled={isAddingToCalendar}
                icon="calendar-plus"
                buttonColor="#EC4899"
                style={styles.calendarButton}
              >
                Add to Calendar
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleGenerateNew}
          style={styles.actionButton}
        >
          Generate New Ideas
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          style={styles.actionButton}
        >
          Back to Home
        </Button>
      </View>

      <Snackbar
        visible={!!message}
        onDismiss={() => setMessage(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {message || ''}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6F8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF5FB',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FDE2F3',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#EC4899',
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    color: '#A855F7',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#EC4899',
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF5FB',
    borderWidth: 1,
    borderColor: '#FDE2F3',
  },
  venueName: {
    color: '#EC4899',
    fontWeight: '600',
  },
  chip: {
    backgroundColor: '#FFF',
    borderColor: '#EC4899',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    color: '#EC4899',
    marginBottom: 12,
    fontWeight: '500',
  },
  reason: {
    marginBottom: 12,
    lineHeight: 20,
    color: '#1F2937',
    fontSize: 15,
  },
  timeContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  time: {
    marginTop: 4,
    fontWeight: '500',
    color: '#EC4899',
  },
  calendarButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    marginVertical: 4,
  },
  button: {
    marginTop: 16,
  },
  snackbar: {
    backgroundColor: '#EC4899',
  },
});

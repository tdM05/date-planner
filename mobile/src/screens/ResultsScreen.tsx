import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDateStore } from '../store';
import { format, parseISO } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<any>;

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { datePlan, clearDatePlan } = useDateStore();

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
          Your Date Options
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          We found {datePlan.events.length} great options for you!
        </Text>
      </View>

      {/* Date Event Suggestions */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Recommended Venues
        </Text>
        {datePlan.events.map((event, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleLarge">{event.name}</Text>
                <Chip mode="outlined">#{index + 1}</Chip>
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
          </Card>
        ))}
      </View>

      {/* Free Time Slots */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Available Time Slots
        </Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          Times when both you and your partner are free
        </Text>

        {datePlan.free_time_slots.slice(0, 10).map((slot, index) => (
          <Card key={index} style={styles.slotCard}>
            <Card.Content>
              <View style={styles.slotRow}>
                <View style={styles.slotTime}>
                  <Text variant="bodyMedium">
                    {format(parseISO(slot.start), 'EEE, MMM d')}
                  </Text>
                  <Text variant="bodySmall" style={styles.slotTimeDetail}>
                    {format(parseISO(slot.start), 'h:mm a')} - {format(parseISO(slot.end), 'h:mm a')}
                  </Text>
                </View>
                <Chip mode="outlined" compact>
                  {slot.duration_hours.toFixed(1)}h
                </Chip>
              </View>
            </Card.Content>
          </Card>
        ))}

        {datePlan.free_time_slots.length > 10 && (
          <Text variant="bodySmall" style={styles.moreText}>
            +{datePlan.free_time_slots.length - 10} more time slots available
          </Text>
        )}
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
          onPress={() => navigation.navigate('Home')}
          style={styles.actionButton}
        >
          Back to Home
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionSubtitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#666',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    color: '#666',
    marginBottom: 12,
  },
  reason: {
    marginBottom: 12,
    lineHeight: 20,
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
  },
  slotCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTime: {
    flex: 1,
  },
  slotTimeDetail: {
    color: '#666',
    marginTop: 2,
  },
  moreText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
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
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { calendarAPI, CalendarEvent, FreeSlot } from '../api/calendar';
import { format, parseISO } from 'date-fns';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ScheduleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [partnerEvents, setPartnerEvents] = useState<CalendarEvent[]>([]);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScheduleData = async () => {
    try {
      setError(null);

      // Get date range: next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Fetch all data in parallel
      const [myEventsRes, partnerEventsRes, freeSlotsRes] = await Promise.allSettled([
        calendarAPI.getMyEvents(startDateStr, endDateStr),
        calendarAPI.getPartnerEvents(startDateStr, endDateStr),
        calendarAPI.getFreeSlots(startDateStr, endDateStr, 2.0),
      ]);

      // Handle my events
      if (myEventsRes.status === 'fulfilled') {
        setMyEvents(myEventsRes.value.events);
        setMyName(myEventsRes.value.user_name);
      }

      // Handle partner events
      if (partnerEventsRes.status === 'fulfilled') {
        setPartnerEvents(partnerEventsRes.value.events);
        setPartnerName(partnerEventsRes.value.user_name);
      }

      // Handle free slots
      if (freeSlotsRes.status === 'fulfilled') {
        setFreeSlots(freeSlotsRes.value.free_slots);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      loadScheduleData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScheduleData();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading schedule..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#F9A8D4', '#F5E6F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Schedule</Text>
        <Text style={styles.headerSubtitle}>
          {`Next 7 days • ${freeSlots.length} free slots`}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Free Time Slots Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💕 Free Time Together</Text>
          {freeSlots.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🕐</Text>
              <Text style={styles.emptyText}>
                No mutual free time found in the next 7 days
              </Text>
            </View>
          ) : (
            freeSlots.map((slot, index) => (
              <View key={index} style={styles.freeSlotCard}>
                <View style={styles.freeSlotHeader}>
                  <Text style={styles.freeSlotTime}>
                    {format(parseISO(slot.start), 'EEE, MMM d')}
                  </Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {`${slot.duration_hours.toFixed(2)}h free`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.freeSlotTimeRange}>
                  {`${format(parseISO(slot.start), 'h:mm a')} - ${format(parseISO(slot.end), 'h:mm a')}`}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* My Events Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{`📅 ${myName}'s Schedule`}</Text>
          {myEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No events scheduled</Text>
            </View>
          ) : (
            myEvents.map((event, index) => (
              <View key={index} style={[styles.eventCard, styles.myEventCard]}>
                <Text style={styles.eventSummary}>{event.summary}</Text>
                <Text style={styles.eventTime}>
                  {`${format(parseISO(event.start), 'EEE, MMM d')} • ${format(parseISO(event.start), 'h:mm a')}`}
                </Text>
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Partner Events Section */}
        {partnerName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{`💗 ${partnerName}'s Schedule`}</Text>
            {partnerEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No events scheduled</Text>
              </View>
            ) : (
              partnerEvents.map((event, index) => (
                <View key={index} style={[styles.eventCard, styles.partnerEventCard]}>
                  <Text style={styles.eventSummary}>{event.summary}</Text>
                  <Text style={styles.eventTime}>
                    {`${format(parseISO(event.start), 'EEE, MMM d')} • ${format(parseISO(event.start), 'h:mm a')}`}
                  </Text>
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
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
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  freeSlotCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9333EA',
  },
  freeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeSlotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  durationBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333EA',
  },
  freeSlotTimeRange: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  myEventCard: {
    backgroundColor: '#DBEAFE',
    borderLeftColor: '#3B82F6',
  },
  partnerEventCard: {
    backgroundColor: '#FECACA',
    borderLeftColor: '#EF4444',
  },
  eventSummary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
});

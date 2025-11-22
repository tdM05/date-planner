import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDateStore } from '../store';
import { format, parseISO, addHours } from 'date-fns';
import { calendarAPI } from '../api';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<any>;

export const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { datePlan, clearDatePlan } = useDateStore();
  const [message, setMessage] = useState<string | null>(null);
  const [addingEventIndex, setAddingEventIndex] = useState<number | null>(null);

  const handleAddVenueToCalendar = async (event: any, index: number) => {
    try {
      setAddingEventIndex(index);

      // Parse the suggested time and create a 2-hour event
      const startTime = parseISO(event.suggested_time);
      const endTime = addHours(startTime, 2);

      // Add event to Google Calendar (and partner's calendar if connected)
      const response = await calendarAPI.addEvent({
        summary: `Date: ${event.name}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: event.address || undefined,
        description: event.reason,
      });

      // Show different message based on whether it was added to partner's calendar too
      if (response.added_to_partner_calendar) {
        setMessage(`✓ "${event.name}" added to both calendars!`);
      } else {
        setMessage(`✓ "${event.name}" added to your calendar!`);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to add to calendar. Please connect your calendar in Settings.';
      setMessage(errorMsg);
    } finally {
      setAddingEventIndex(null);
    }
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://app?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open maps:', err);
        setMessage('Failed to open maps');
      });
    }
  };

  if (!datePlan) {
    return (
      <View style={styles.emptyContainer}>
        <RNText style={styles.emptyText}>No date plan available</RNText>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={['#F9A8D4', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyButton}
          >
            <RNText style={styles.emptyButtonText}>Generate a Date Plan</RNText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const handleGenerateNew = () => {
    // Don't clear - just go back to generate a new one
    // The current plan will be saved in history
    navigation.goBack();
  };

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#F9A8D4', '#F5E6F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <RNText style={styles.headerTitle}>Your Date Options</RNText>
        <RNText style={styles.headerSubtitle}>
          We found {datePlan.events.length} great options for you!
        </RNText>
      </LinearGradient>

      <ScrollView style={styles.scrollContent}>
        {/* Date Event Suggestions */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Recommended Venues</RNText>
          {datePlan.events.map((event, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <RNText style={styles.venueName}>{event.name}</RNText>
                <View style={styles.badge}>
                  <RNText style={styles.badgeText}>#{index + 1}</RNText>
                </View>
              </View>

              {event.address && (
                <TouchableOpacity onPress={() => openInMaps(event.address)} activeOpacity={0.7}>
                  <RNText style={styles.address}>📍 {event.address}</RNText>
                </TouchableOpacity>
              )}

              <RNText style={styles.reason}>{event.reason}</RNText>

              <View style={styles.timeContainer}>
                <RNText style={styles.timeLabel}>Suggested Time:</RNText>
                <RNText style={styles.time}>
                  {format(parseISO(event.suggested_time), 'EEE, MMM d, yyyy \'at\' h:mm a')}
                </RNText>
              </View>

              <TouchableOpacity
                onPress={() => handleAddVenueToCalendar(event, index)}
                disabled={addingEventIndex === index}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={addingEventIndex === index ? ['#D1D5DB', '#D1D5DB'] : ['#F9A8D4', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.calendarButton, addingEventIndex === index && styles.calendarButtonDisabled]}
                >
                  <RNText style={styles.calendarButtonText}>
                    {addingEventIndex === index ? 'Adding...' : '📅 Add to Calendar'}
                  </RNText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleGenerateNew}>
            <View style={styles.secondaryButton}>
              <RNText style={styles.secondaryButtonText}>Generate New Ideas</RNText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
            <View style={styles.textButton}>
              <RNText style={styles.textButtonText}>Back to Home</RNText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom notification */}
      {message && (
        <View style={[
          styles.notification,
          message.startsWith('✓') ? styles.notificationSuccess : styles.notificationError
        ]}>
          <RNText style={styles.notificationText}>{message}</RNText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333EA',
  },
  address: {
    fontSize: 14,
    color: '#EC4899',
    marginBottom: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  reason: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  timeContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendarButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarButtonDisabled: {
    opacity: 0.6,
  },
  calendarButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#EC4899',
    fontSize: 15,
    fontWeight: '500',
  },
  notification: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationSuccess: {
    backgroundColor: '#10B981',
  },
  notificationError: {
    backgroundColor: '#EF4444',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

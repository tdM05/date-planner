import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Snackbar, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDateStore } from '../store';
import { format } from 'date-fns';
import { DatePickerModal } from '../components/DatePickerModal';

type NavigationProp = NativeStackNavigationProp<any>;

export const DateGeneratorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { generateDatePlan, isGenerating, error, clearError } = useDateStore();

  const [prompt, setPrompt] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateDatePlan({
        prompt,
        location,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      // Navigate to results
      navigation.navigate('Results');
    } catch (err) {
      // Error is handled by the store
    }
  };

  const isFormValid = prompt.trim() && location.trim();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Plan Your Date
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Tell us what kind of date you'd like, and we'll find the perfect options based on your schedules.
        </Text>

        <TextInput
          label="What kind of date?"
          value={prompt}
          onChangeText={setPrompt}
          mode="outlined"
          placeholder="e.g., cozy italian restaurant, outdoor adventure, movie night"
          multiline
          numberOfLines={3}
          style={styles.input}
          disabled={isGenerating}
        />

        <TextInput
          label="Location"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          placeholder="e.g., New York, NY"
          style={styles.input}
          disabled={isGenerating}
        />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Date Range
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          We'll find free time in your calendars during this period
        </Text>

        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => setShowStartDatePicker(true)}
            disabled={isGenerating}
          >
            <Card style={styles.dateCardInner}>
              <Card.Content>
                <View style={styles.dateCardContent}>
                  <Text variant="labelSmall" style={styles.dateLabel}>Start Date</Text>
                  <Text variant="bodySmall" style={styles.dateIcon}>💕</Text>
                </View>
                <Text variant="titleMedium" style={styles.dateValue}>
                  {format(startDate, 'MMM d, yyyy')}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => setShowEndDatePicker(true)}
            disabled={isGenerating}
          >
            <Card style={styles.dateCardInner}>
              <Card.Content>
                <View style={styles.dateCardContent}>
                  <Text variant="labelSmall" style={styles.dateLabel}>End Date</Text>
                  <Text variant="bodySmall" style={styles.dateIcon}>💕</Text>
                </View>
                <Text variant="titleMedium" style={styles.dateValue}>
                  {format(endDate, 'MMM d, yyyy')}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        <Text variant="bodySmall" style={styles.hint}>
          Tap a date to change it
        </Text>

        <Button
          mode="contained"
          onPress={handleGenerate}
          loading={isGenerating}
          disabled={isGenerating || !isFormValid}
          style={styles.button}
          icon="heart"
        >
          {isGenerating ? 'Generating...' : 'Generate Date Ideas'}
        </Button>

        {isGenerating && (
          <Text variant="bodySmall" style={styles.loadingText}>
            This may take 5-10 seconds...
          </Text>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showStartDatePicker}
        onDismiss={() => setShowStartDatePicker(false)}
        onSelectDate={(date) => setStartDate(date)}
        initialDate={startDate}
        label="Select Start Date"
      />

      <DatePickerModal
        visible={showEndDatePicker}
        onDismiss={() => setShowEndDatePicker(false)}
        onSelectDate={(date) => setEndDate(date)}
        initialDate={endDate}
        label="Select End Date"
      />

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={5000}
      >
        {error || ''}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
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
  sectionTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  hint: {
    color: '#999',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  dateCard: {
    flex: 1,
  },
  dateCardInner: {
    backgroundColor: '#FFF5FB',
    borderWidth: 1,
    borderColor: '#FDE2F3',
    elevation: 0,
  },
  dateCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    color: '#EC4899',
    fontWeight: '600',
  },
  dateIcon: {
    fontSize: 16,
  },
  dateValue: {
    color: '#1F2937',
    fontWeight: '600',
  },
  button: {
    marginVertical: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
  },
});

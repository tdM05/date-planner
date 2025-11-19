import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDateStore } from '../store';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<any>;

export const DateGeneratorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { generateDatePlan, isGenerating, error, clearError } = useDateStore();

  const [prompt, setPrompt] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now

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
          <View style={styles.dateInput}>
            <Text variant="labelMedium">Start Date</Text>
            <Text variant="bodyMedium">{format(startDate, 'MMM d, yyyy')}</Text>
            {/* In production, you'd use a date picker here */}
          </View>
          <View style={styles.dateInput}>
            <Text variant="labelMedium">End Date</Text>
            <Text variant="bodyMedium">{format(endDate, 'MMM d, yyyy')}</Text>
            {/* In production, you'd use a date picker here */}
          </View>
        </View>

        <Text variant="bodySmall" style={styles.note}>
          Note: Using simplified dates for now. In production, you can tap to select specific dates.
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
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  note: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  button: {
    marginVertical: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
  },
});

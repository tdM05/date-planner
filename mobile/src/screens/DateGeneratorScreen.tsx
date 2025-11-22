import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Text, TextInput as RNTextInput } from 'react-native';
import { Snackbar, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDateStore } from '../store';
import { format } from 'date-fns';
import { DatePickerModal } from '../components/DatePickerModal';
import { DateGenerationProgress } from '../components/DateGenerationProgress';

type NavigationProp = NativeStackNavigationProp<any>;

export const DateGeneratorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { generateDatePlan, isGenerating, error, clearError } = useDateStore();

  const [prompt, setPrompt] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleGenerate = async () => {
    try {
      // Set end date to end of day to include full last day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      await generateDatePlan({
        prompt,
        location,
        start_date: startDate.toISOString(),
        end_date: endOfDay.toISOString(),
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
      {/* Header Section */}
      <LinearGradient
        colors={['#F9A8D4', '#F5E6F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Plan Your Date</Text>
        <Text style={styles.headerSubtitle}>
          Tell us what you'd like and we'll find perfect options
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* What kind of date card */}
        <View style={styles.card}>
          <Text style={styles.label}>What kind of date?</Text>
          <RNTextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="e.g., cozy italian restaurant, outdoor adventure..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            style={styles.textInput}
            editable={!isGenerating}
          />
        </View>

        {/* Location card */}
        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <RNTextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., New York, NY"
            placeholderTextColor="#9CA3AF"
            style={styles.textInputSingle}
            editable={!isGenerating}
          />
        </View>

        {/* Date Range */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date Range</Text>
          <Text style={styles.hint}>
            We'll find free time in your calendars during this period
          </Text>

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowStartDatePicker(true)}
              disabled={isGenerating}
              activeOpacity={0.7}
            >
              <View style={styles.dateCardInner}>
                <View style={styles.dateCardHeader}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateIcon}>💕</Text>
                </View>
                <Text style={styles.dateValue}>
                  {format(startDate, 'MMM d, yyyy')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowEndDatePicker(true)}
              disabled={isGenerating}
              activeOpacity={0.7}
            >
              <View style={styles.dateCardInner}>
                <View style={styles.dateCardHeader}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={styles.dateIcon}>💕</Text>
                </View>
                <Text style={styles.dateValue}>
                  {format(endDate, 'MMM d, yyyy')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, (!isFormValid || isGenerating) && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating || !isFormValid}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={(!isFormValid || isGenerating) ? ['#D1D5DB', '#D1D5DB'] : ['#EC4899', '#D946EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : '💕 Generate Date Ideas'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <DateGenerationProgress visible={isGenerating} />

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
        style={styles.snackbar}
      >
        {error || ''}
      </Snackbar>
    </KeyboardAvoidingView>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInputSingle: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateCard: {
    flex: 1,
  },
  dateCardInner: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
  },
  dateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateIcon: {
    fontSize: 16,
  },
  dateValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  generateButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  snackbar: {
    backgroundColor: '#EC4899',
  },
});

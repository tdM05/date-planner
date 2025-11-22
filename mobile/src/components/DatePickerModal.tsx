import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';

interface DatePickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
  label?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onDismiss,
  onSelectDate,
  initialDate = new Date(),
  label = 'Select Date',
}) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    onSelectDate(selectedDate);
    onDismiss();
  };

  const renderCalendar = () => {
    const daysCount = daysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headerRow = (
      <View style={styles.weekRow} key="headers">
        {dayHeaders.map((day) => (
          <View style={styles.dayHeader} key={day}>
            <Text variant="labelSmall" style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>
    );
    days.push(headerRow);

    // Add empty cells for days before the first day of the month
    let dayElements = [];
    for (let i = 0; i < firstDay; i++) {
      dayElements.push(
        <View style={styles.dayCell} key={`empty-${i}`} />
      );
    }

    // Add day cells
    for (let day = 1; day <= daysCount; day++) {
      const isToday =
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      dayElements.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, styles.dayButton]}
          onPress={() => handleDateSelect(day)}
        >
          <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
            <Text
              variant="bodyMedium"
              style={[styles.dayText, isToday && styles.todayText]}
            >
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );

      // Start a new row after Saturday
      if ((firstDay + day) % 7 === 0 || day === daysCount) {
        days.push(
          <View style={styles.weekRow} key={`week-${day}`}>
            {dayElements}
          </View>
        );
        dayElements = [];
      }
    }

    return days;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.headerTitle}>
                {label}
              </Text>
            </View>

            {/* Month/Year Navigation */}
            <View style={styles.navigation}>
              <IconButton
                icon="chevron-left"
                size={24}
                onPress={handlePreviousMonth}
                iconColor="#EC4899"
              />
              <Text variant="titleMedium" style={styles.monthYearText}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <IconButton
                icon="chevron-right"
                size={24}
                onPress={handleNextMonth}
                iconColor="#EC4899"
              />
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendar}>
              {renderCalendar()}
            </View>

            {/* Close Button */}
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.closeButton}
              textColor="#666"
            >
              Cancel
            </Button>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: 340,
    maxWidth: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#EC4899',
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYearText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  calendar: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayHeader: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderText: {
    color: '#999',
    fontWeight: '600',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    borderRadius: 20,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: '#FEE2F8',
  },
  dayText: {
    color: '#1F2937',
  },
  todayText: {
    color: '#EC4899',
    fontWeight: '600',
  },
  closeButton: {
    borderColor: '#E5E7EB',
  },
});

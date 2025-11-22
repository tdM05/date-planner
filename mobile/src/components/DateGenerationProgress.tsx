import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface DateGenerationProgressProps {
  visible: boolean;
}

const STAGES = [
  { message: '💭 Asking Claude for date ideas...', progress: 0.33 },
  { message: '📅 Finding free time in your calendars...', progress: 0.66 },
  { message: '✨ Creating your perfect date plan...', progress: 0.95 },
];

export const DateGenerationProgress: React.FC<DateGenerationProgressProps> = ({ visible }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      // Reset when modal closes
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    // Smoothly animate progress within each stage
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const targetProgress = STAGES[currentStage].progress;
        if (prev < targetProgress) {
          return Math.min(prev + 0.005, targetProgress);
        }
        return prev;
      });
    }, 100);

    // Move to next stage every 3 seconds
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 10000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [visible, currentStage]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#EC4899', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>
              Planning Your Date
            </Text>

            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress}
                color="#FFFFFF"
                style={styles.progressBar}
              />
              <Text variant="bodyLarge" style={styles.percentage}>
                {Math.round(progress * 100)}%
              </Text>
            </View>

            <Text variant="bodyLarge" style={styles.message}>
              {STAGES[currentStage].message}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    color: '#EC4899',
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FDE2F3',
    marginBottom: 8,
  },
  percentage: {
    color: '#EC4899',
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: '#A855F7',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 60,
  },
});

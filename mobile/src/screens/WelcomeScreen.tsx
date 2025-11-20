import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<any>;

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
  bgColor: string;
}

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const features: Feature[] = [
    {
      id: 1,
      title: 'Personalized Dates',
      description: 'AI-powered suggestions',
      icon: '💜',
      bgColor: '#F3E5F5',
    },
    {
      id: 2,
      title: 'Flower Reminders',
      description: 'Keep the romance alive',
      icon: '🌸',
      bgColor: '#FCE4EC',
    },
  ];

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative circles */}
        <View style={[styles.decorativeCircle, styles.circleTopLeft]} />
        <View style={[styles.decorativeCircle, styles.circleTopRight]} />

        {/* Logo Placeholder */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#EC4899', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoPlaceholder}
          >
            <Text style={styles.logoHeart}>♥</Text>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>TwoDo</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Two lives, endless moments</Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={[styles.iconContainer, { backgroundColor: feature.bgColor }]}>
                <Text style={styles.icon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={handleSignUp}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EC4899', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signUpGradient}
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign In Link */}
        <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
          <Text style={styles.signInText}>Already have an account?</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6F8',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  circleTopLeft: {
    backgroundColor: '#C084FC',
    top: 100,
    left: 20,
  },
  circleTopRight: {
    backgroundColor: '#F9A8D4',
    top: 40,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logoHeart: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#DB2777',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 48,
    textAlign: 'center',
    fontWeight: '400',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  signUpButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signInText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default WelcomeScreen;
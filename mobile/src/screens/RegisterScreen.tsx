import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store';

type NavigationProp = NativeStackNavigationProp<any>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update error message when store error changes
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setTimeout(() => {
        setErrorMessage('');
        clearError();
      }, 3000);
    }
  }, [error]);

  const handleRegister = async () => {
    try {
      await register({ email, password, full_name: fullName });
      // Navigation will happen automatically
    } catch (err) {
      // Error is already set in the store
    }
  };

  const handleGoogleSignUp = () => {
    navigation.navigate('GoogleOAuth');
  };

  const isFormValid = fullName.trim() && email.trim() && password.length >= 8 && password.length <= 72;

  return (
    <View style={styles.container}>
      {/* Decorative circles like login screen */}
      <View style={[styles.decorativeCircle, styles.circleTopLeft]} />
      <View style={[styles.decorativeCircle, styles.circleTopRight]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Main Title */}
          <Text style={styles.title}>Create account</Text>

          {/* Greeting Message */}
          <Text style={styles.subtitle}>Sign up to start planning</Text>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor="#B8B8B8"
              autoCapitalize="words"
              style={styles.input}
              editable={!isLoading}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#B8B8B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#B8B8B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                style={[styles.input, styles.passwordInput]}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Hints */}
          {password && password.length < 8 && (
            <Text style={styles.hint}>Password must be at least 8 characters</Text>
          )}
          {password && password.length > 72 && (
            <Text style={styles.hint}>Password must be 72 characters or less</Text>
          )}

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Create Account Button */}
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={handleRegister}
            disabled={isLoading || !isFormValid}
            activeOpacity={0.8}
          >
            {(isLoading || !isFormValid) ? (
              <View style={styles.disabledButtonView}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createAccountButtonText}>Create Account</Text>
                )}
              </View>
            ) : (
              <LinearGradient
                colors={['#EC4899', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createAccountGradient}
              >
                <Text style={styles.createAccountButtonText}>Create Account</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign Up Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={20} color="#000000ff" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Already have account */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
            style={styles.bottomSignInContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.bottomSignInText}>
              Have an account? <Text style={styles.bottomSignInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6F8',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 40,
    opacity: 0.3,
  },
  circleTopLeft: {
    backgroundColor: '#C084FC',
    width: 80,
    height: 80,
    top: 620,
    left: 30,
  },
  circleTopRight: {
    backgroundColor: '#F9A8D4',
    width: 60,
    height: 60,
    top: 100,
    right: 30,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  backIcon: {
    fontSize: 32,
    color: '#1F2937',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#50545eff',
    fontWeight: '400',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 0,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  createAccountButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  disabledButtonView: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  createAccountGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 16,
    borderWidth: 0,
    marginBottom: 24,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  bottomSignInContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  bottomSignInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSignInLink: {
    color: '#EC4899',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

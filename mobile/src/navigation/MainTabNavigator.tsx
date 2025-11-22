import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { DateGeneratorScreen } from '../screens/DateGeneratorScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { useCoupleStore } from '../store';
import { Home, Calendar, Heart, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

const ProfileIcon: React.FC<{ color: string; focused: boolean }> = ({ color, focused }) => {
  const { hasCouple } = useCoupleStore();
  
  return (
    <View style={styles.iconContainer}>
      <User 
        size={24} 
        color={color}
        fill={focused ? '#FCE7F3' : 'none'}
      />
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#EC4899',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 0 : 8,
          height: Platform.OS === 'ios' ? 88 : 65,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={24} 
              color={color}
              fill={focused ? '#FCE7F3' : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Calendar 
              size={24} 
              color={color}
              fill={focused ? '#FCE7F3' : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Dates"
        component={DateGeneratorScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Heart
              size={24}
              color={color}
              fill={focused ? '#FCE7F3' : 'none'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
  },
});
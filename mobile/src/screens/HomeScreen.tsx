import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, useCoupleStore } from '../store';
import { LoadingSpinner } from '../components/LoadingSpinner';

type NavigationProp = NativeStackNavigationProp<any>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  
  const { user } = useAuthStore();
  const {
    partner,
    hasCouple,
    calendarStatus,
    fetchPartner,
    fetchCalendarStatus,
    isLoading,
  } = useCoupleStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = async () => {
    await Promise.all([fetchPartner(), fetchCalendarStatus()]);
  };

  // Reload data whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isLoading && !partner && !calendarStatus) {
    return <LoadingSpinner message="Loading..." />;
  }

  return ( 
    // Handle padding manually so the gradient can go behind the status bar.
    <View style={styles.container}>
      
      {/* Header Section */}
      <LinearGradient
        colors={['#F9A8D4', '#F5E6F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header, 
          // Add dynamic padding to the top of the header
          { paddingTop: insets.top + 20 } 
        ]}
      >
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.full_name}!</Text>
        <Text style={styles.subtitle}>
          {hasCouple && partner ? 'Find quality time together' : 'Flying solo for now'}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
      >
        
        {!hasCouple ? (
        // No couple state - Show invitation card
           <>
           {/* Invite Partner Card */}
           <View style={styles.card}>
             <View style={styles.cardHeader}>
               <View style={styles.iconCircle}>
                 <Text style={styles.iconText}>💗</Text>
               </View>
               <View style={styles.cardHeaderText}>
                 <Text style={styles.cardTitle}>Invite Your Partner</Text>
                 <Text style={styles.cardDescription}>
                   Get more out of TwoDo by connecting with your partner
                 </Text>
               </View>
             </View>
             <TouchableOpacity
               style={styles.primaryButton}
               onPress={() => navigation.navigate('InvitePartner')}
               activeOpacity={0.8}
             >
               <LinearGradient
                 colors={['#EC4899', '#D946EF']}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
                 style={styles.buttonGradient}
               >
                 <Text style={styles.primaryButtonText}>Send Invitation</Text>
               </LinearGradient>
             </TouchableOpacity>
             <TouchableOpacity
               onPress={() => navigation.navigate('AcceptInvitation')}
               style={styles.secondaryTextButton}
               activeOpacity={0.7}
             >
               <Text style={styles.secondaryTextButtonText}>Have a code?</Text>
             </TouchableOpacity>
           </View>
 
           {/* Quick Actions*/}
           <Text style={styles.sectionTitle}>Quick Actions</Text>
           <View style={styles.quickActionsGrid}>
             <TouchableOpacity style={[styles.quickActionCard, styles.flowersCard]} activeOpacity={0.7}>
               <Text style={styles.quickActionIcon}>🌸</Text>
               <Text style={styles.quickActionTitle}>Flowers</Text>
               <Text style={styles.quickActionSubtitle}>Set reminders</Text>
             </TouchableOpacity>
 
             <TouchableOpacity
               style={[styles.quickActionCard, styles.scheduleCard]}
               onPress={() => navigation.navigate('Settings')}
               activeOpacity={0.7}
             >
               <Text style={styles.quickActionIcon}>📅</Text>
               <Text style={styles.quickActionTitle}>Calendar</Text>
               <Text style={styles.quickActionSubtitle}>Sync now</Text>
             </TouchableOpacity>
           </View>
         </>
        ) : (
          // Has couple state - Show full features
          <>
          {/* Upcoming Free Time Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitleBold}>Upcoming Free Time</Text>
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🕐</Text>
              <Text style={styles.emptyStateText}>
                {calendarStatus?.user_connected && calendarStatus?.partner_connected
                  ? 'Check your shared schedule for free time'
                  : 'Connect with your partner to see shared free time'}
              </Text>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => navigation.navigate('Schedule')}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineButtonText}>View Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Plan Your Next Date Card */}
          <View style={[styles.card, styles.dateCard]}>
            <Text style={styles.dateCardTitle}>Make Time For Each Other</Text>
            <Text style={styles.dateCardDescription}>
              Studies have shown couples who spend regular quality time together are happier in their relationships.
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => navigation.navigate('Dates')}
              disabled={
                !calendarStatus?.user_connected ||
                !calendarStatus?.partner_connected
              }
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#e87bb1ff', '#da76e9ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Plan your next date</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Actions - Full */}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={[styles.quickActionCard, styles.flowersCard]} activeOpacity={0.7}>
              <Text style={styles.quickActionIcon}>🌸</Text>
              <Text style={styles.quickActionTitle}>Flowers</Text>
              <Text style={styles.quickActionSubtitle}>Renew in 3d</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.scheduleCard]}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionTitle}>Calendar</Text>
              <Text style={styles.quickActionSubtitle}>Sync now</Text>
            </TouchableOpacity>
          </View>

          {(!calendarStatus?.user_connected ||
            !calendarStatus?.partner_connected) && (
            <Text style={styles.hint}>
              Both partners need to connect their calendars to generate date plans.
            </Text>
          )}
        </>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#393d44ff',
    fontWeight: '400',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryTextButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryTextButtonText: {
    fontSize: 14,
    color: '#EC4899',
    fontWeight: '500',
  },
  cardTitleBold: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  outlineButtonText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  dateCard: {
    backgroundColor: '#F3E8FF',
  },
  dateCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  dateCardDescription: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dateButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#EC4899',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48%', 
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16, 
  },
  giftCard: {
    backgroundColor: '#FCE7F3',
  },
  flowersCard: {
    backgroundColor: '#F3E8FF',
  },
  adviceCard: {
    backgroundColor: '#DBEAFE',
  },
  scheduleCard: {
    backgroundColor: '#FEF3C7',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  hint: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 24,
    fontSize: 12,
  },
});

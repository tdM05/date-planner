import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { InvitePartnerScreen } from '../screens/InvitePartnerScreen';
import { AcceptInvitationScreen } from '../screens/AcceptInvitationScreen';

const Stack = createNativeStackNavigator();

export const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InvitePartner"
        component={InvitePartnerScreen}
        options={{
          headerShown: true,
          title: 'Invite Partner',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="AcceptInvitation"
        component={AcceptInvitationScreen}
        options={{
          headerShown: true,
          title: 'Accept Invitation',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
};

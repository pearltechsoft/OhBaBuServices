import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import BookingListScreen from './screens/BookingListingScreen';
import BookingDetailsScreen from './screens/BookingDetailsScreen';
import PublishAvailabilityScreen from './screens/PublishAvailabilityScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
        
        <Stack.Screen
          name="Bookings"
          component={BookingListScreen}
        />

        <Stack.Screen
  name="BookingDetails"
  component={BookingDetailsScreen}
/>

<Stack.Screen
  name="PublishAvailability"
  component={PublishAvailabilityScreen}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
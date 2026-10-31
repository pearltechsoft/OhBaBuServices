/**
 * App.js – root of the OhBaBu Provider app.
 *
 * Navigation structure (stack-based, manual):
 *
 *   LoginScreen  ──▶  BookedSlotsScreen  ──▶  BookingDetailsScreen
 *                                                   │
 *                                          PublishAvailabilityScreen
 *
 * Navigation is handled by passing a lightweight `navigation` prop that
 * exposes `navigate(name)` and `replace(name)`.  This keeps the project
 * dependency-free until React Navigation is installed.
 *
 * Firebase credentials will be added later via google-services.json /
 * GoogleService-Info.plist.
 */

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import BookedSlotsScreen from './src/screens/BookedSlotsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

// ─── Screen registry ──────────────────────────────────────────────────────────
const SCREENS = {
  Login: 'Login',
  Home: 'Home',
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(SCREENS.Login);

  // Lightweight navigation object shared with every screen.
  const navigation = {
    navigate: (name) => setScreen(name),
    replace: (name) => setScreen(name),
    goBack: () => setScreen(SCREENS.Login),
  };

  // Sign-out: clears all stored session data, returns to Login.
  async function handleSignOut() {
    try {
      await auth().signOut();
    } catch (_) {
      // Ignore – may not be signed in via Firebase in all cases.
    }
    try {
      await AsyncStorage.multiRemove([
        'token',
        'reftoken',
        'username',
        'agencyId',
        'agencyname',
        'firstName',
        'lastName',
        'languageID',
        'themeID',
        'agencychannel',
      ]);
    } catch (_) {
      // Non-fatal
    }
    setScreen(SCREENS.Login);
  }

  switch (screen) {
    case SCREENS.Home:
      return (
        <SafeAreaProvider>
          <BookedSlotsScreen
            navigation={navigation}
            onSignOut={handleSignOut}
          />
        </SafeAreaProvider>
      );

    case SCREENS.Login:
    default:
      return (
        <SafeAreaProvider>
          <LoginScreen navigation={navigation} />
        </SafeAreaProvider>
      );
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FC',
  },
});

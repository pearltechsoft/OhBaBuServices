/**
 * LoginScreen.js
 *
 * Phone OTP login screen for the OhBaBu Provider App.
 *
 * Flow:
 *  1. Provider enters 10-digit Indian mobile number.
 *  2. Firebase sends an OTP SMS.
 *  3. Provider enters the 6-digit OTP.
 *  4. On success, Firebase ID token is exchanged with the OhBaBu backend
 *     (/ohbabu/user/fcb) for JWT access + refresh tokens.
 *  5. Tokens and user preferences are stored in AsyncStorage.
 *  6. Screen navigates to "Home" (BookedSlots).
 *
 * NOTE: Firebase credentials will be added later.  The auth import is kept
 *       so the integration point is clear; the module will resolve once
 *       google-services.json / GoogleService-Info.plist are in place.
 *
 * UI: uses the existing App.js design (navy/blue palette, no extra assets).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

import { exchangeFirebaseToken, fetchUserPreferences } from '../utils/api';

// ─── Colour tokens (matches existing App.js palette) ──────────────────────────
const COLORS = {
  background: '#F4F7FC',
  navy: '#19365A',
  primary: '#2D63ED',
  muted: '#8190A8',
  border: '#D6DFED',
  white: '#FFFFFF',
  body: '#687B98',
  green: '#239653',
  red: '#D93025',
  paleBlue: '#EAF0FF',
};

// ─── Error message helper ─────────────────────────────────────────────────────
function getFirebaseErrorMessage(error) {
  const code = error?.code || '';
  const msg = error?.message || '';
  if (code === 'auth/operation-not-allowed')
    return 'Phone sign-in is not enabled for this project. Check Firebase Authentication settings.';
  if (code === 'auth/billing-not-enabled')
    return 'Firebase billing is not enabled for this request.';
  if (code === 'auth/invalid-phone-number')
    return 'Firebase rejected this phone number. Check the country code and number.';
  if (code === 'auth/too-many-requests')
    return 'Too many attempts. Please wait before trying again.';
  if (code === 'auth/invalid-verification-code')
    return 'That verification code is incorrect. Please check and try again.';
  if (code === 'auth/session-expired' || code === 'auth/code-expired')
    return 'This verification session expired. Request a new code.';
  return msg || 'Something went wrong. Please try again.';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Prevents Firebase's persisted session from auto-logging in on mount.
  const isOtpFlowActive = useRef(false);

  // ── Startup: silent token check ────────────────────────────────────────────
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          navigation.replace('Home');
        }
      } catch (_) {
        // No token – stay on login screen
      }
    };
    checkExistingSession();
  }, []);

  // ── Firebase auth-state listener ───────────────────────────────────────────
  // Only fires when the user manually triggered the OTP flow.
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser && firebaseUser.phoneNumber && isOtpFlowActive.current) {
        handlePhoneAuthSuccess(firebaseUser);
      }
    });
    return unsubscribe;
  }, []);

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  async function sendCode() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    isOtpFlowActive.current = true;

    try {
      const result = await auth().signInWithPhoneNumber(`+91${digits}`);
      setConfirmation(result);
      setMessage(`Verification request accepted for +91 ${digits}.`);
    } catch (e) {
      console.error('[Firebase Auth] Phone verification request failed', {
        code: e?.code,
        message: e?.message,
      });
      isOtpFlowActive.current = false;
      setError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  async function verifyCode() {
    if (!confirmation) {
      setError('Request a verification code first.');
      return;
    }
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const credential = await confirmation.confirm(code);
      if (credential?.user) {
        await handlePhoneAuthSuccess(credential.user);
      }
    } catch (e) {
      console.error('[Firebase Auth] Phone verification failed', {
        code: e?.code,
        message: e?.message,
      });
      setError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Backend exchange + store tokens + navigate ─────────────────────
  async function handlePhoneAuthSuccess(firebaseUser) {
    isOtpFlowActive.current = false;
    setLoading(true);
    try {
      // 1. Get Firebase ID token
      const idToken = await firebaseUser.getIdToken(true);

      // 2. Exchange with OhBaBu backend
      const { accessToken, refreshToken } = await exchangeFirebaseToken(idToken);
      if (!accessToken) throw new Error('No access token received from the server.');

      // 3. Derive username from phone number (strip +91 country code)
      const rawPhone = firebaseUser.phoneNumber || '';
      const username = rawPhone.startsWith('+91')
        ? rawPhone.substring(3)
        : rawPhone.replace(/^\+/, '');

      // 4. Persist to AsyncStorage
      await AsyncStorage.multiSet([
        ['token', accessToken],
        ['reftoken', refreshToken],
        ['username', username],
      ]);

      // 5. Fetch and store user preferences (agencyId, language, theme, name)
      try {
        const prefs = await fetchUserPreferences(username);
        const toStore = [];
        if (prefs.firstName) toStore.push(['firstName', prefs.firstName]);
        if (prefs.lastName) toStore.push(['lastName', prefs.lastName]);
        if (prefs.agentid) toStore.push(['agencyId', String(prefs.agentid)]);
        if (prefs.agencyname) toStore.push(['agencyname', prefs.agencyname]);
        if (prefs.languageid) toStore.push(['languageID', prefs.languageid]);
        if (prefs.themeid) toStore.push(['themeID', prefs.themeid]);
        if (prefs.channel) toStore.push(['agencychannel', prefs.channel]);
        if (toStore.length) await AsyncStorage.multiSet(toStore);
      } catch (prefErr) {
        // Non-fatal: navigate anyway
        console.warn('[Login] fetchUserPreferences failed:', prefErr.message);
      }

      // 6. Navigate to Home (replace so Back doesn't return to Login)
      navigation.replace('Home');
    } catch (err) {
      console.error('[Login] handlePhoneAuthSuccess error:', err);
      setError(err.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  // ── Change number (reset OTP flow) ─────────────────────────────────────────
  function changeNumber() {
    setConfirmation(null);
    setOtp('');
    setError('');
    setMessage('');
    isOtpFlowActive.current = false;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logo}>
              <Text style={styles.logoText}>O</Text>
            </View>

            <Text style={styles.eyebrow}>OHBABU · PROVIDER</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in securely to manage your availability and bookings.
            </Text>

            {/* ── Phone number entry ── */}
            {!confirmation ? (
              <>
                <Text style={styles.label}>Mobile number</Text>

                <View style={styles.phoneField}>
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.fieldDivider} />
                  <TextInput
                    accessibilityLabel="10-digit Indian mobile number"
                    style={styles.input}
                    value={phone}
                    onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                    placeholder="6301985973"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                    returnKeyType="done"
                  />
                </View>

                <Text style={styles.helperText}>
                  We will send you a one-time verification code.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={sendCode}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && !loading ? styles.buttonPressed : null,
                    loading ? styles.buttonDisabled : null,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send verification code</Text>
                  )}
                </Pressable>
              </>
            ) : (
              /* ── OTP entry ── */
              <>
                <Text style={styles.label}>Verification code</Text>

                <View style={styles.codeField}>
                  <TextInput
                    accessibilityLabel="6-digit verification code"
                    style={styles.codeInput}
                    value={otp}
                    onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    returnKeyType="done"
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={verifyCode}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && !loading ? styles.buttonPressed : null,
                    loading ? styles.buttonDisabled : null,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify and continue</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={changeNumber}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkButtonText}>Change mobile number</Text>
                </Pressable>
              </>
            )}

            {/* Error / success feedback */}
            {!!error && (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {error}
              </Text>
            )}
            {!!message && !error && (
              <Text style={styles.successText}>{message}</Text>
            )}

            <Text style={styles.footerText}>
              Passwordless sign-in powered by Firebase.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 32,
  },
  logo: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 17,
    marginBottom: 24,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 12,
  },
  title: {
    color: COLORS.navy,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.body,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 48,
  },
  label: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  phoneField: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  countryCode: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  fieldDivider: {
    width: 1,
    height: 23,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },
  input: {
    flex: 1,
    color: COLORS.navy,
    fontSize: 16,
    minHeight: 54,
    paddingVertical: 0,
  },
  codeField: {
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  codeInput: {
    color: COLORS.navy,
    fontSize: 19,
    letterSpacing: 5,
    minHeight: 54,
    paddingVertical: 0,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 11,
  },
  primaryButton: {
    minHeight: 52,
    marginTop: 23,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  linkButton: {
    marginTop: 20,
    paddingVertical: 5,
    alignItems: 'center',
  },
  linkButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  successText: {
    color: COLORS.green,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 15,
  },
  footerText: {
    color: '#9AA8BE',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 50,
  },
});


import { useEffect, useState } from 'react';
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
import auth from '@react-native-firebase/auth';
import BookedSlotsScreen from './src/screens/BookedSlotsScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

function getErrorMessage(error) {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'auth/operation-not-allowed') {
    return 'Phone sign-in is not enabled for this Firebase project or SMS delivery region. Check Firebase Authentication settings.';
  }

  if (code === 'auth/billing-not-enabled') {
    return 'Firebase reports that billing is not enabled for this request. Do not add a personal card without approval; check the project configuration with your project owner.';
  }

  if (code === 'auth/invalid-phone-number') {
    return 'Firebase rejected this phone number. Check the country code and number.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many attempts were made. Wait before trying again.';
  }

  if (code === 'auth/invalid-verification-code') {
    return 'That verification code is incorrect. Check the code and try again.';
  }

  if (
    code === 'auth/session-expired' ||
    code === 'auth/code-expired'
  ) {
    return 'This verification session expired. Request a new code.';
  }

  return message || 'Something went wrong. Please try again.';
}

export default function App() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Firebase is the source of truth for sign-in status.
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(
      (firebaseUser) => {
        setUser(firebaseUser || null);
        setInitializing(false);
      }
    );

    return unsubscribe;
  }, []);

  // Request a phone verification code.
  async function sendCode() {
    const digits = phone.replace(/\D/g, '');

    if (digits.length !== 10) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await auth().signInWithPhoneNumber(
        `+91${digits}`
      );

      setConfirmation(result);
      setMessage(
        `Verification request accepted for +91 ${digits}.`
      );
    } catch (e) {
      // Never log the user's phone number or OTP.
      console.error(
        '[Firebase Auth] Phone verification request failed',
        {
          code: e?.code,
          message: e?.message,
        }
      );

      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // Verify the OTP and sign in.
  async function verifyCode() {
    const code = otp.trim();

    if (!confirmation) {
      setError('Request a verification code first.');
      return;
    }

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
        setUser(credential.user);
        setConfirmation(null);
        setOtp('');
        setMessage('Phone verified successfully.');
      }
    } catch (e) {
      console.error(
        '[Firebase Auth] Phone verification failed',
        {
          code: e?.code,
          message: e?.message,
        }
      );

      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // Return to the phone number screen.
  function changeNumber() {
    setConfirmation(null);
    setOtp('');
    setError('');
    setMessage('');
  }

  // Sign out of Firebase.
  async function signOut() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await auth().signOut();

      setUser(null);
      setConfirmation(null);
      setOtp('');
      setPhone('');
      setMessage('You have signed out.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  // Show a loading screen while Firebase restores the session.
  if (initializing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Checking your sign-in status…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

// Show booked slots after successful login.
if (user) {
  return (
    <BookedSlotsScreen
      phoneNumber={user.phoneNumber || ''}
      onSignOut={signOut}
    />
  );
}

  // Show login or OTP verification when signed out.
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>O</Text>
            </View>

            <Text style={styles.eyebrow}>
              OHBABU · PROVIDER
            </Text>

            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.subtitle}>
              Sign in securely to manage your availability
              and bookings.
            </Text>

            {!confirmation ? (
              <>
                <Text style={styles.label}>
                  Mobile number
                </Text>

                <View style={styles.phoneField}>
                  <Text style={styles.countryCode}>
                    +91
                  </Text>

                  <View style={styles.fieldDivider} />

                  <TextInput
                    accessibilityLabel="10-digit Indian mobile number"
                    style={styles.input}
                    value={phone}
                    onChangeText={(value) =>
                      setPhone(
                        value.replace(/\D/g, '').slice(0, 10)
                      )
                    }
                    placeholder="6301985973"
                    placeholderTextColor={colors.muted}
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
                    pressed && !loading
                      ? styles.buttonPressed
                      : null,
                    loading ? styles.buttonDisabled : null,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Send verification code
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>
                  Verification code
                </Text>

                <View style={styles.codeField}>
                  <TextInput
                    accessibilityLabel="6-digit verification code"
                    style={styles.codeInput}
                    value={otp}
                    onChangeText={(value) =>
                      setOtp(
                        value.replace(/\D/g, '').slice(0, 6)
                      )
                    }
                    placeholder="123456"
                    placeholderTextColor={colors.muted}
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
                    pressed && !loading
                      ? styles.buttonPressed
                      : null,
                    loading ? styles.buttonDisabled : null,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Verify and continue
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={changeNumber}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkButtonText}>
                    Change mobile number
                  </Text>
                </Pressable>
              </>
            )}

            {error ? (
              <Text
                accessibilityRole="alert"
                style={styles.errorText}
              >
                {error}
              </Text>
            ) : null}

            {message ? (
              <Text style={styles.successText}>
                {message}
              </Text>
            ) : null}

            <Text style={styles.footerText}>
              Passwordless sign-in powered by Firebase.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = {
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 14,
    color: colors.body,
    fontSize: 14,
  },

  logo: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: 17,
    marginBottom: 24,
  },

  logoText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 12,
  },

  title: {
    color: colors.navy,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 10,
  },

  subtitle: {
    color: colors.body,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 48,
  },

  label: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },

  phoneField: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 15,
  },

  countryCode: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },

  fieldDivider: {
    width: 1,
    height: 23,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },

  input: {
    flex: 1,
    color: colors.navy,
    fontSize: 16,
    minHeight: 54,
    paddingVertical: 0,
  },

  codeField: {
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 15,
  },

  codeInput: {
    color: colors.navy,
    fontSize: 19,
    letterSpacing: 5,
    minHeight: 54,
    paddingVertical: 0,
  },

  helperText: {
    color: colors.muted,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 52,
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  secondaryButtonText: {
    color: colors.primary,
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  errorText: {
    color: colors.red,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },

  successText: {
    color: colors.green,
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

  signedInCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginTop: -15,
    marginBottom: 28,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginRight: 8,
  },

  statusText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
  },

  cardLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 5,
  },

  phoneValue: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  cardDescription: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 18,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 15,
    marginBottom: 11,
  },

  featureIcon: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  featureIconText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },

  featureCopy: {
    flex: 1,
  },

  featureTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  featureDescription: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 18,
  },
});
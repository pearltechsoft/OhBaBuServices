import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  ImageBackground,
} from "react-native";
import * as Location from 'expo-location';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchTheme, useTheme } from "./utils/constants";
import i18n from './i18n';
import { useTranslation } from 'react-i18next';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from './context/AuthContext';
import auth from '@react-native-firebase/auth';
import { registerForPushNotificationsAsync } from "./PushNotification";
import { API } from './utils/constants';
import { refreshAccessToken, isLoggedIn } from './utils/tokenService';

const getLoginStyles = (theme) => {
  const { themeColor, bgcolour, textColor } = theme;

  return StyleSheet.create({
    background: {
      flex: 1,
      resizeMode: "cover",
      justifyContent: "center",
    },
    container: {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      borderRadius: 10,
      marginHorizontal: 20,
    },
    title: {
      fontWeight: "bold",
      fontSize: 50,
      color: themeColor,
      marginBottom: 40,
    },
    inputView: {
      width: "100%",
      borderRadius: 10,
      height: 50,
      marginBottom: 10,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    inputText: {
      height: 50,
      borderWidth: 1,
      borderRadius: 10,
      borderColor: "grey",
      color: "black",
      paddingLeft: 10,
    },
    loginBtn: {
      width: "100%",
      backgroundColor: themeColor,
      borderRadius: 10,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      marginBottom: 10,
    },
    loginBtntxt: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "bold",
    },
    otpInfo: {
      fontSize: 14,
      color: "black",
      marginBottom: 15,
      textAlign: 'center',
    },
    changeNumberBtn: {
      marginTop: 10,
      alignItems: 'center',
    },
    changeNumberText: {
      color: themeColor,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
  });
};

const Login = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = getLoginStyles(theme);
  const { login } = useAuth();

  // Phone auth states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Ref to prevent Firebase's persisted session from auto-logging in on mount.
  const isOtpFlowActive = useRef(false);

  const BackgroundImg = require("./assets/background-image.jpg");
  const LogoImg = require("./assets/user-icon.webp");

  // ── Startup token check ───────────────────────────────────────────────────
  // If a token already exists, attempt a silent refresh and navigate to Home.
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;

        console.log('[Login] Existing token found, attempting silent refresh...');
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log('[Login] Silent refresh succeeded, navigating to Home.');
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })
          );
        } else {
          console.log('[Login] Silent refresh failed, staying on Login.');
        }
      } catch (err) {
        console.warn('[Login] checkAndRefreshToken error:', err);
      }
    };

    checkAndRefreshToken();
  }, []);

  // ── Firebase auth state listener ──────────────────────────────────────────
  // Only act when the user manually triggered the OTP flow (isOtpFlowActive).
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user && user.phoneNumber && isOtpFlowActive.current) {
        console.log('Firebase auto-confirmed OTP for:', user.phoneNumber);
        handlePhoneAuthSuccess(user);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  // ── Location Tracking (silent, non-blocking) ──────────────────────────────
  useEffect(() => {
    saveUserLocation();
  }, []);

  const saveUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const locationString = `${latitude},${longitude}`;

      let pincode = '';
      let address = '';
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'User-Agent': 'OhBaBuUserApp/1.0' } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          pincode = geoData?.address?.postcode || '';
          address =
            geoData?.address?.county ||
            geoData?.address?.city_district ||
            geoData?.address?.suburb ||
            geoData?.address?.state_district ||
            geoData?.address?.state || '';
        }
      } catch (geoErr) {
        console.warn('Reverse-geocoding failed:', geoErr);
      }

      const storedLocation = await AsyncStorage.getItem('userLocation');
      if (storedLocation !== locationString) {
        const response = await fetch('https://www.ohbabu.com/ohbabu/user/LocationTracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: locationString, pincode, address }),
        });
        if (response.ok) {
          await AsyncStorage.setItem('userLocation', locationString);
          if (pincode) await AsyncStorage.setItem('userPincode', pincode);
          if (address) await AsyncStorage.setItem('userAddress', address);
          console.log('LocationTracker updated successfully');
        }
      }
    } catch (err) {
      console.warn('saveUserLocation error (non-blocking):', err);
    }
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSignInWithPhoneNumber = async () => {
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    let cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length === 10) {
      cleanedNumber = `+91${cleanedNumber}`;
    } else if (cleanedNumber.length === 12 && cleanedNumber.startsWith('91')) {
      cleanedNumber = `+${cleanedNumber}`;
    } else {
      alert('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    isOtpFlowActive.current = true;
    try {
      const confirmation = await auth().signInWithPhoneNumber(cleanedNumber);
      setConfirm(confirmation);
      console.log('Verification code sent to:', cleanedNumber);
    } catch (error) {
      console.error('Phone sign-in error:', error);
      isOtpFlowActive.current = false;
      if (error.code === 'auth/invalid-phone-number') {
        alert('Invalid phone number format.');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many requests. Please try again later.');
      } else {
        alert(error.message || 'Failed to send verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const confirmCode = async () => {
    if (!verificationCode) {
      alert('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await confirm.confirm(verificationCode);
      const user = auth().currentUser;
      if (user) {
        await handlePhoneAuthSuccess(user);
      }
    } catch (error) {
      console.error('Code confirmation error:', error);
      setLoading(false);
      if (error.code === 'auth/invalid-verification-code') {
        alert('Invalid verification code. Please try again.');
      } else {
        alert(error.message || 'Code confirmation failed.');
      }
    }
  };

  // ── Step 3: Backend auth + store tokens + navigate ────────────────────────
  const handlePhoneAuthSuccess = async (user) => {
    setLoading(true);
    try {
      // 1. Get Firebase ID token
      const idToken = await user.getIdToken(true);
      console.log('Firebase ID token obtained, length:', idToken.length);

      // 2. Exchange with backend
      const response = await fetch('https://ohbabu.com/ohbabu/ohbabu/user/fcb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const responseText = await response.text();
      console.log('Backend /fcb response status:', response.status);

      if (!response.ok) {
        throw new Error(`Backend authentication failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      const { accessToken, refreshToken } = data;

      if (!accessToken) throw new Error('No access token received from backend');

      // 3. Derive phone-based username (strip +91 country code)
      const rawPhone = user.phoneNumber || '';
      const phoneUsername = rawPhone.startsWith('+91')
        ? rawPhone.substring(3)
        : rawPhone.replace(/^\+/, '');
      await AsyncStorage.setItem("token",accessToken);
      await AsyncStorage.setItem("reftoken",refreshToken);
      // 4. Persist tokens via AuthContext + AsyncStorage
      // await login(accessToken, refreshToken);
      await AsyncStorage.setItem('username', phoneUsername);
      console.log('Stored username (phone):', phoneUsername);

      // 5. Update push notification token
      await updatePushToken(phoneUsername, accessToken);

      // 6. Fetch user preferences (agency, language, theme)
      await fetchuserpref(phoneUsername, accessToken);

      // 7. Navigate to Home
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })
      );
    } catch (error) {
      console.error('Phone auth backend error:', error);
      setLoading(false);
      alert(error.message || 'Could not connect to the server.');
    }
  };

  // ── Push Token ────────────────────────────────────────────────────────────
  const updatePushToken = async (phoneUsername, accessToken) => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) {
        console.error('Push token not generated.');
        return;
      }
      const encodedUsername = encodeURIComponent(phoneUsername);
      const encodedPushToken = encodeURIComponent(pushToken);

      const response = await fetch(
        `${API}user/registrations/${encodedUsername}/updatePushToken/${encodedPushToken}`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );
      const body = await response.text();
      if (!response.ok) {
        console.warn(`Push token update failed: ${response.status} - ${body}`);
      } else {
        console.log('Push token updated successfully');
      }
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  };

  // ── Language Helper ───────────────────────────────────────────────────────
  const applyLanguage = async (languageId) => {
    if (!languageId) return;
    try {
      await AsyncStorage.setItem('languageID', languageId);
      let langCode = 'en';
      if (languageId.toLowerCase() === 'telugu') langCode = 'tel';
      if (languageId.toLowerCase() === 'hindi') langCode = 'hin';
      await i18n.changeLanguage(langCode);
      console.log('Language changed to:', langCode);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  // ── User Preferences ──────────────────────────────────────────────────────
  const fetchuserpref = async (usernameParam, tokenParam) => {
    const username = usernameParam || await AsyncStorage.getItem('username');
    const token = tokenParam || await AsyncStorage.getItem('token');

    try {
      const response = await fetch(
        `https://www.ohbabu.com/ohbabu/user/agencypreferences/${username}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`User preferences fetch failed with status ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('User_pref fetched successfully:', data);

      if (data.firstName) await AsyncStorage.setItem('firstName', data.firstName);
      if (data.lastName) await AsyncStorage.setItem('lastName', data.lastName);
      if (data.agentid) {
        console.log('Agency ID:', data.agentid);
        await AsyncStorage.setItem('agencyId', data.agentid.toString());
      }
      if (data.languageid) {
        console.log('Language ID:', data.languageid);
        await AsyncStorage.setItem('languageID', data.languageid);
        await applyLanguage(data.languageid);
      }
      if (data.themeid) {
        console.log('Theme ID:', data.themeid);
        await AsyncStorage.setItem('themeID', data.themeid);
        await fetchTheme();
      }
      if (data.agencyname) {
        console.log('Agency Name:', data.agencyname);
        await AsyncStorage.setItem('agencyname', data.agencyname);
      }
      if (data.channel) {
        await AsyncStorage.setItem('agencychannel', data.channel);
        console.log('agencychannel:', data.channel);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground source={BackgroundImg} style={styles.background}>
        <View style={styles.container}>
          <Image source={LogoImg} style={{ width: 60, height: 60 }} />
          <Text style={styles.title}>{t('login')}</Text>

          {!confirm ? (
            // ── Phone Number Entry ──────────────────────────────────────────
            <>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Phone Number (10 digits)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor="#003f5c"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  maxLength={10}
                />
              </View>
              <TouchableOpacity
                onPress={handleSignInWithPhoneNumber}
                style={styles.loginBtn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loginBtntxt}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // ── OTP Entry ──────────────────────────────────────────────────
            <>
              <Text style={styles.otpInfo}>
                Verification code sent to {phoneNumber}
              </Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter 6-digit OTP"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholderTextColor="#003f5c"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                onPress={confirmCode}
                style={styles.loginBtn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loginBtntxt}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setConfirm(null);
                  setVerificationCode('');
                  isOtpFlowActive.current = false;
                }}
                style={styles.changeNumberBtn}
              >
                <Text style={styles.changeNumberText}>Change Phone Number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Login;

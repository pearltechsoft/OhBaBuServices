# OhBaBu Login Frontend

A clean React Native / Expo login screen using Firebase passwordless phone OTP.

## Included
- Single-screen mobile number entry (+91)
- Firebase SMS OTP request and verification
- Clear loading, success, and error messages
- Minimal React Native styles
- Android package ID retained: `com.pearltechsoft.ohbabu`

## Before running
1. Install Node.js LTS and Android Studio/Android SDK.
2. Open this folder in a terminal.
3. Run `npm install`.
4. In Firebase Console for project `ohbabuservices-login-test`, enable **Phone** under Authentication > Sign-in method.
5. To test without sending an SMS, configure a fictional phone number and verification code under Authentication > Phone numbers for testing. Enter that number in the app and use its configured code.
6. For real phone numbers, Firebase requires a Cloud Billing account linked to the project for its SMS service. The Firebase Console owner must review the project billing plan before real SMS requests can work.
7. Add SHA-1 and SHA-256 fingerprints for the Android signing key used to build the app, as required by Firebase phone authentication.
8. Keep the root `google-services.json` and `android/app/google-services.json` from the same Firebase project. Both must register Android package `com.pearltechsoft.ohbabu`.
9. Run `npx expo prebuild --platform android` if the native Android folder has not been generated, then run `npx expo run:android`.

Phone OTP requires a native Android build; Expo Go is not sufficient for React Native Firebase.

## Scope
This is the frontend login page only. It does not call your manager's backend or exchange Firebase ID tokens for backend tokens yet. Once the UI and OTP are verified, your manager can provide the backend contract for integration.

Never include a Firebase Admin service-account JSON/private key in a mobile app. The admin key was intentionally not copied into this project.

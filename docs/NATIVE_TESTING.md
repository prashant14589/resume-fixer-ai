# Native Testing

This app now has native-only pieces:

1. Razorpay checkout
2. real PDF share flow

These will not fully work in plain web preview.

## Fastest path

### Option A: EAS development build

Use this if you want the smoothest path.

1. Install EAS CLI on your machine
2. Log in to Expo
3. Run a development build for Android

Commands:

```powershell
npx eas login
npx eas build --profile development --platform android
```

After build:

1. install the APK/dev build on your Android phone
2. run:

```powershell
npx expo start --dev-client
```

3. open the dev build and connect to Metro

## Option B: Local native Android run

Use this only if Android Studio and SDK are already set up.

```powershell
npm run prebuild
npm run android:native
```

## What to test natively

1. Open app
2. Paste resume
3. Free analysis works
4. Tap paywall CTA
5. Razorpay checkout opens
6. Successful payment unlocks result
7. PDF export works
8. WhatsApp share opens

## Required backend pieces before payment test

Deploy and configure:

1. `analyze-resume`
2. `create-payment-order`
3. `verify-payment`

Required secrets:

```env
OPENAI_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

## Recommendation

For speed, use EAS development build.

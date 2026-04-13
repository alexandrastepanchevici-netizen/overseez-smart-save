# Overseez Android Setup Guide

Run these steps in order from inside the `overseez/` folder.

---

## Step 1 — Install dependencies

```bash
npm install
```

---

## Step 2 — Set up Firebase (free, takes ~5 min)

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `overseez-prod` → disable Analytics → Create
3. Click the **Android icon** to add an Android app:
   - Package name: `co.overseez.app`
   - App nickname: `Overseez Android`
   - Click **Register app**
4. Download `google-services.json` — **save it, you'll need it in Step 5**
5. Click the **Web icon (`</>`)** to add a Web app:
   - Nickname: `Overseez Web`
   - Copy the `firebaseConfig` values shown
6. Fill in your `.env` file with the Firebase values:
   ```
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."
   ```
7. For `VITE_FIREBASE_VAPID_KEY`: In Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → **Generate key pair** → copy the public key

---

## Step 3 — Initialize Capacitor & add Android

```bash
npx cap init "Overseez" "co.overseez.app" --web-dir dist
npx cap add android
```

---

## Step 4 — Place google-services.json

Copy the `google-services.json` you downloaded in Step 2 to:

```
android/app/google-services.json
```

---

## Step 5 — Add Firebase to Android Gradle

In `android/build.gradle` (project-level), add inside `buildscript > dependencies`:
```groovy
classpath 'com.google.gms:google-services:4.4.1'
```

In `android/app/build.gradle` (app-level), add at the very bottom:
```groovy
apply plugin: 'com.google.gms.google-services'
```

Also add inside the `dependencies {}` block:
```groovy
implementation platform('com.google.firebase:firebase-bom:32.7.2')
implementation 'com.google.firebase:firebase-messaging'
```

---

## Step 6 — Add Android permissions to AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Add inside `<application>`:
```xml
<service
    android:name="com.google.firebase.messaging.FirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

Add an intent filter inside the existing `<activity>` tag (the BridgeActivity):
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="co.overseez.app" android:host="auth" />
</intent-filter>
```

---

## Step 7 — Set up Supabase redirect URLs

In your Supabase Dashboard → Authentication → URL Configuration, add to Redirect URLs:
- `co.overseez.app://auth/callback`
- `co.overseez.app://**`

---

## Step 8 — Add your app icon and splash screen

Place your logo file as:
- `resources/icon.png` — square PNG, 1024×1024 or larger
- `resources/splash.png` — 2732×2732 PNG (logo centred on dark background)

Then generate all sizes:
```bash
npx capacitor-assets generate --android \
  --iconBackgroundColor '#0a0f1e' \
  --splashBackgroundColor '#0a0f1e'
```

---

## Step 9 — Run the Supabase migration

In Supabase Dashboard → SQL Editor, run the contents of:
`supabase/migrations/20260413000000_device_tokens.sql`

---

## Step 10 — Build and test

```bash
npm run cap:sync        # builds web + syncs to Android
npx cap open android    # opens Android Studio
```

In Android Studio:
- Run on an emulator or connected device to test
- Build > Generate Signed Bundle/APK > Android App Bundle to produce the `.aab` for Google Play

---

## Step 11 — Generate signing keystore (for Play Store release)

```bash
keytool -genkey -v \
  -keystore overseez-release.jks \
  -alias overseez \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store `overseez-release.jks` safely — never commit it to GitHub.

---

## What was changed in the code

| File | Change |
|---|---|
| `src/App.tsx` | BrowserRouter → HashRouter; added DeepLinkHandler + push notifications |
| `src/integrations/supabase/client.ts` | Added PKCE auth flow + `getRedirectUrl()` |
| `src/contexts/AuthContext.tsx` | Pass `emailRedirectTo` on signUp |
| `src/pages/Subscription.tsx` | `window.open()` → `openExternalUrl()` (works in WebView) |
| `src/pages/SearchPage.tsx` | Geolocation uses Capacitor plugin on Android |
| `src/pages/Index.tsx` | Social links use `openExternalUrl()` |
| `src/lib/openExternalUrl.ts` | New — cross-platform external URL opener |
| `src/lib/firebase.ts` | New — Firebase app init |
| `src/hooks/usePushNotifications.ts` | New — FCM token registration |
| `src/components/DeepLinkHandler.tsx` | New — handles auth deep links |
| `capacitor.config.ts` | New — Capacitor configuration |
| `vite.config.ts` | Added build chunk splitting |
| `package.json` | Added Capacitor packages + cap:* scripts |
| `supabase/migrations/20260413000000_device_tokens.sql` | New — stores FCM tokens per user |

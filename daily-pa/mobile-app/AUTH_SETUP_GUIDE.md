# Apple & Google Login Setup Guide

This guide explains how to enable Apple and Google Sign-In for your Daily PA mobile app. The app is already configured to use **Supabase Auth**, so most of the setup happens in the Supabase Console and third-party developer portals.

---

## 1. Supabase Redirect URL Configuration

Before configuring providers, you must ensure Supabase knows where to redirect users after they log in.

1.  Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2.  Under **Redirect URLs**, add the following URLs:
    *   `dailypa://auth/callback` (For production/native builds)
    *   `https://auth.expo.io/@your-username/mobile-app` (For Expo Go development, replace `@your-username` with your Expo username)
    *   *Note: Using `exp://` schemes is deprecated for Auth Proxies; standard deep links are preferred.*

---

## 2. Google Sign-In Setup

The app uses the "Web Browser" flow which is universally supported and recommended by Supabase for React Native.

### Step A: Google Cloud Console
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "Daily PA").
3.  Go to **APIs & Services** -> **OAuth consent screen**.
    *   Choose **External**.
    *   **App Name**: Enter your app's name here (e.g., "Daily PA"). This is what users will see on the "Choose an account to continue to..." screen instead of the URL.
    *   Fill in support email.
4.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
    *   Application Type: **Web application**.
    *   Name: "Supabase Auth".
    *   **Authorized redirect URIs**:
        *   Copy the "Callback URL (for OAuth)" from your **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google** (It looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
5.  Click **Create**.
6.  Copy the **Client ID** and **Client Secret**.

### Step B: Supabase Console
1.  Go to **Supabase Dashboard** -> **Authentication** -> **Providers**.
2.  Select **Google**.
3.  Enable "Google enabled".
4.  Paste the **Client ID** and **Client Secret** from Step A.
5.  Click **Save**.

### Step C: Test
*   Reload your app.
*   Go to **Settings** -> **Log In**.
*   Tap "Sign in with Google". It should open a browser, let you login, and redirect back to the app logged in.

---

## 3. Apple Sign-In Setup (iOS Only)

**Prerequisites**:
*   You must have a paid [Apple Developer Account](https://developer.apple.com/).
*   You must act as the Team Agent/Admin.

### Step A: Apple Developer Portal
1.  Go to **Certificates, Identifiers & Profiles**.
2.  **Identifiers** -> **App IDs** -> Create New.
    *   **Bundle ID**: Must match the one in your `app.json` (`com.dailypa.app`).
    *   **Capabilities**: Check **Sign In with Apple**.
    *   Save.
3.  **Identifiers** -> **Services IDs** -> Create New.
    *   Identifier: `com.dailypa.app.service` (example).
    *   Configure: Enable **Sign In with Apple**.
    *   Click "Configure" next to it -> Add your **Supabase Callback URL** (from Supabase -> Auth -> Providers -> Apple) to "Return URLs".
    *   Save.
4.  **Keys** -> Create New.
    *   Name: "Supabase Auth Key".
    *   Check **Sign In with Apple**.
    *   Click Configure -> Select your primary App ID (`com.dailypa.app`).
    *   Download the Key file (`.p8`). **Keep this safe!**
    *   Note the **Key ID** and your **Team ID**.

### Step B: Supabase Console
1.  Go to **Supabase Dashboard** -> **Authentication** -> **Providers**.
2.  Select **Apple**.
3.  Enable "Apple enabled".
4.  Fill in the fields:
    *   **Client ID**: This is your **Services ID** (e.g., `com.dailypa.app.service`), NOT the Bundle ID.
    *   **Team ID**: Your Apple Team ID.
    *   **Key ID**: The ID of the key you created.
    *   **Private Key**: Open the `.p8` file you downloaded in a text editor and paste the ENTIRE content.
5.  Click **Save**.

### Step C: Xcode / Expo Config
Since the app uses the native `expo-apple-authentication` library:
1.  Apple Sign-In works **only on real devices** or **iOS Simulator** (signed builds). It does NOT work in Expo Go securely for production logic, but the library mocks it in development often.
2.  Ensure your `app.json` has the correct bundle ID:
    ```json
    "ios": {
      "bundleIdentifier": "com.dailypa.app",
      "usesAppleSignIn": true
    }
    ```
    *(Note: I checked your app.json, please ensure `usesAppleSignIn: true` is added if you build with EAS).*

---

## Troubleshooting

*   **"Redirect URL mismatch"**: Check that the URL in your Google Cloud Console matches EXACTLY the one in Supabase.
*   **"App doesn't open after login"**: Check that `dailypa://` is a valid scheme in your `app.json` and that you rebuilt the app if testing a standalone build. For Expo Go, ensure you are using the Expo proxy URL or your IP address logic correctly.

# Daily PA - Project Architecture

## Overview
Daily PA is a cross-platform productivity application consisting of a modern web application (Next.js) and a native mobile application (Expo/React Native). Both platforms share a common backend infrastructure (Supabase) and state management patterns.

## 🏗 Project Structure

### 1. Web Application (Root)
*   **Path**: `/`
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Deployment**: Vercel (implied) + Capacitor (for mobile wrapper)

**Tech Stack:**
*   **State Management**: `zustand` (Global State) + `@tanstack/react-query` (Server State)
*   **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
*   **UI Library**: Radix UI Primitives + Lucide Icons
*   **Backend/DB**: Supabase (PostgreSQL + Auth)
*   **Testing**: Vitest (Unit) + Playwright (E2E)
*   **AI/ML**: `openai` (likely for smart features) + `tesseract.js` (OCR)

### 2. Mobile Application
*   **Path**: `/mobile-app`
*   **Framework**: React Native (Expo SDK 54)
*   **Language**: TypeScript

**Tech Stack:**
*   **Core**: Expo Router / React Navigation 7
*   **State Management**: `zustand`
*   **Backend**: Supabase JS Client
*   **Native Features**:
    *   **Auth**: Biometrics (`expo-local-authentication`), Apple Auth
    *   **Media**: Camera, Image Picker, Audio (`expo-av`)
    *   **Storage**: Secure Store, Async Storage, File System
    *   **Widgets**: Android Widgets (`react-native-android-widget`)
    *   **Monetization**: RevenueCat (`react-native-purchases`)

## 🔄 Data Flow & State

### Authentication
*   **Provider**: Supabase Auth (Shared across Web & Mobile).
*   **Mobile**: Uses `expo-auth-session` and `expo-secure-store` to persist sessions securely.
*   **Web**: Uses `@supabase/ssr` for server-side auth handling in Next.js.

### Database
*   **Source**: Supabase (PostgreSQL).
*   **Access**:
    *   **Web**: Direct DB access via Supabase Client (RLS protected).
    *   **Mobile**: Direct DB access via Supabase Client (RLS protected).
*   **Sync**: `react-query` (Web) handles caching and invalidation. Mobile likely uses `useEffect` or custom hooks with Zustand.

### State Management
*   **Zustand**: Used in both apps for client-side global state (e.g., user preferences, UI state).
*   **Isolation**: The web and mobile apps have *separate* stores (no shared code workspace currently), meaning logic must be duplicated or manually synced if changed.

## 📱 Key Features
1.  **Smart Productivity**: Tasks, Calendar, Expenses.
2.  **AI Integration**: OpenAI integration for text/task processing.
3.  **OCR**: Image-to-text capabilities (Tesseract on web, likely native APIs on mobile).
4.  **Widgets**: Home screen widgets for Android.

## 🛠 Building & Deployment
*   **Web**: `npm run build` (Next.js build).
*   **Mobile**: `npx expo run:android` / `npx expo run:ios`.
*   **Capacitor**: The web app *also* has Capacitor configured (`build:mobile` script), suggesting a hybrid approach was tested before/alongside the Expo app.

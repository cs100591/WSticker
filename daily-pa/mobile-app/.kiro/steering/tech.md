# Technology Stack

## Core Technologies

- **React Native 0.81.5**: Cross-platform mobile framework
- **Expo ~54**: Development tooling and native module access
- **TypeScript 5.9**: Type-safe development with strict mode enabled
- **React 19.1**: UI library

## State Management & Data

- **Zustand 5.0**: Lightweight state management (stores in `src/store/`)
- **Supabase 2.90**: Backend-as-a-service for auth and data sync
- **AsyncStorage**: Local persistence for session data

## Navigation & UI

- **React Navigation 7**: Native stack and bottom tabs navigation
- **Expo modules**: Camera, calendar, notifications, biometrics, etc.
- **Custom theme system**: Centralized colors and spacing (`src/theme/`)

## Testing

- **Jest 29**: Test runner with jest-expo preset
- **fast-check 4.5**: Property-based testing library
- **@testing-library/react-native**: Component testing utilities

## Build System

- **Babel**: Module resolution with path aliases (`@/*` → `src/*`)
- **Metro**: React Native bundler
- **Expo prebuild**: Native project generation

## Common Commands

```bash
# Development
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:property  # Run property-based tests only
npm run test:coverage  # Run with coverage report

# Code Quality
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking (no emit)

# Build
expo prebuild          # Generate native projects
```

## Environment Configuration

Required environment variables in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL (must be HTTPS)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `EXPO_PUBLIC_API_URL`: API endpoint for OCR services (optional)
- `EXPO_PUBLIC_DEEPSEEK_API_KEY`: AI service key (optional)

## Key Dependencies

- **@supabase/supabase-js**: Backend client
- **react-hook-form + zod**: Form validation
- **expo-secure-store**: Encrypted token storage
- **expo-notifications**: Push notifications
- **expo-camera**: Receipt scanning
- **expo-calendar**: Native calendar integration (iOS)
- **expo-local-authentication**: Biometric auth

## TypeScript Configuration

- Strict mode enabled
- Path aliases: `@/*` maps to `src/*`
- Experimental decorators enabled
- Extends `expo/tsconfig.base`

## Testing Configuration

Two Jest configs:
1. **jest.config.js**: Full React Native tests with jest-expo preset
2. **jest.property.config.js**: Isolated property tests with minimal setup

Property tests use `*.property.test.ts` naming convention.

# Mobile App - iOS & Android

A cross-platform mobile application built with React Native and Expo, featuring offline-first architecture, real-time sync, and comprehensive task management.

## 🚀 Features

### Core Functionality
- ✅ **Todo Management** - Create, edit, filter, and track todos with due dates
- ✅ **Expense Tracking** - Track expenses with categories and receipt scanning
- ✅ **Calendar Integration** - Manage events with automatic todo-to-event conversion
- ✅ **AI Assistant** - Chat interface with natural language todo/expense creation
- ✅ **Apple Calendar Sync** - Bidirectional sync with iOS native calendar (iOS only)
- ✅ **Receipt Scanning** - OCR-powered receipt data extraction
- ✅ **Offline-First** - Full offline support with automatic sync
- ✅ **Biometric Auth** - Face ID / Touch ID support with persistence
- ✅ **Sign in with Apple** - Native Apple authentication (iOS only)
- ✅ **Push Notifications** - Smart notifications for todos and events with tap-to-navigate
- ✅ **Deep Linking** - Support for dailypa:// and https://dailypa.app URLs
- ✅ **Settings & Profile** - Theme selection, currency preferences, profile editing

### Technical Features
- 🔄 **Real-time Sync** - Bidirectional sync with conflict resolution
- 📱 **Cross-Platform** - iOS and Android from single codebase
- 🔒 **Secure Storage** - Encrypted token storage with biometric protection
- 🔐 **Auto-Lock** - Configurable inactivity timeout (1-30 minutes)
- 🛡️ **HTTPS Enforcement** - All network requests use secure HTTPS protocol
- 🔍 **Secure Logging** - Sensitive data automatically filtered from logs
- 🔔 **Push Notifications** - Todo and event notifications with smart navigation
- 🔗 **Deep Linking** - URL-based navigation for notifications and external links
- 🧪 **Property-Based Testing** - 154 tests with fast-check
- 📊 **Statistics** - Real-time analytics and summaries
- 🎨 **Modern UI** - Clean, intuitive interface with theme support

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Physical device with Expo Go app (optional)

## 🛠️ Installation

```bash
# Navigate to mobile-app directory
cd mobile-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏃 Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on physical device
# Scan QR code with Expo Go app
```

### Skip Login (Development Only)

The app includes a "Skip Login" button in development mode to quickly test features without authentication.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run property-based tests only
npm test -- property

# Run with coverage
npm test -- --coverage
```

### Test Coverage
- **154 tests** across 12 test suites
- Property-based tests using fast-check
- Unit tests for models and configuration
- 99.4% pass rate (1 flaky test)

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── TodoForm.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── EventForm.tsx
│   │   ├── ReceiptScanner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── TodosScreen.tsx
│   │   ├── ExpensesScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── authService.ts
│   │   ├── TodoService.ts
│   │   ├── ExpenseService.ts
│   │   ├── CalendarService.ts
│   │   ├── ReceiptService.ts
│   │   └── sync/         # Sync engine
│   ├── models/           # WatermelonDB models
│   │   ├── Todo.ts
│   │   ├── Expense.ts
│   │   ├── CalendarEvent.ts
│   │   └── schema.ts
│   ├── repositories/     # Data access layer
│   ├── navigation/       # Navigation configuration
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── config/           # App configuration
├── __tests__/            # Test files
├── assets/               # Images, fonts, etc.
├── .env.example          # Environment variables template
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## 🏗️ Architecture

### Offline-First Design
- **WatermelonDB** - Local SQLite database
- **Sync Engine** - Automatic bidirectional sync
- **Conflict Resolution** - Last-write-wins strategy
- **Queue Management** - Pending changes queue

### Data Flow
```
UI Components
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
WatermelonDB (Local Storage)
    ↓
Sync Engine
    ↓
Supabase (Remote Backend)
```

### Key Technologies
- **React Native** - Cross-platform framework
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe development
- **WatermelonDB** - Offline-first database
- **Supabase** - Backend as a service
- **React Navigation** - Navigation library
- **Zod** - Schema validation
- **fast-check** - Property-based testing

## 🔧 Configuration

### Environment Variables

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration (for OCR)
EXPO_PUBLIC_API_URL=https://your-api-url.com
```

### App Configuration

Edit `app.json` to customize:
- App name and slug
- Version and build numbers
- Icons and splash screens
- Permissions
- Platform-specific settings

## 📱 Features Guide

### Todo Management
- Create todos with title, description, color, and priority
- Set due dates (automatically creates calendar events)
- Filter by status (active/completed) and color
- View statistics (active, completed, overdue, due today)
- Toggle completion status
- Search todos

### Expense Tracking
- Add expenses with amount, category, and date
- Scan receipts with camera
- OCR extracts amount, date, and merchant
- Filter by category and date range
- View summaries (total, average, by category)
- Track spending patterns

### Calendar
- View events in month/week/day views
- Month view with calendar grid and event indicators
- Week view with timeline and event blocks
- Day view with hourly schedule
- Create and edit events
- Automatic todo-to-event conversion
- Filter events by date
- Color-coded events

### Settings
- Profile management
- Biometric authentication toggle
- Auto-lock configuration (1-30 minutes)
- Notification preferences
- Theme selection (light/dark/system)
- Default currency
- Account deletion with complete data cleanup
- Sign out

## 🔒 Security

- **Secure Storage** - Expo SecureStore for tokens
- **Biometric Auth** - Face ID / Touch ID
- **Sign in with Apple** - Native Apple authentication (iOS)
- **Auto-Lock** - Configurable inactivity timeout (1-30 minutes)
- **HTTPS Only** - All network requests encrypted and validated
- **Token Refresh** - Automatic token renewal
- **Data Sanitization** - Sensitive data filtered from logs
- **Secure Logging** - No passwords or tokens in debug logs
- **Account Deletion** - Complete data cleanup on account deletion
- **Data Encryption** - Encrypted storage for sensitive data with encryption service

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
# Clear cache and restart
npm start -- --clear
```

**iOS build issues:**
```bash
# Clean iOS build
cd ios && pod install && cd ..
```

**Android build issues:**
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

**Database issues:**
```bash
# Reset database (development only)
# Delete app from device/simulator and reinstall
```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [WatermelonDB Documentation](https://watermelondb.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Detailed project status

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## 📄 License

[Your License Here]

## 👥 Team

[Your Team Information]

---

**Built with ❤️ using React Native and Expo**

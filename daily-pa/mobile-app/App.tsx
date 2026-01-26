/**
 * Daily PA Mobile App
 * Main application entry point
 * Optimized for fast launch time with lazy loading
 */

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { View, Text, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SkipLoginContext } from './src/contexts/SkipLoginContext';
import { supabase } from './src/services/supabase';
// FloatingChatbot and GlassBottomNav removed

// Lazy load screens for faster initial load
// Auth screens are loaded immediately as they're needed first
// ... imports
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ...


// Direct imports to avoid caching issues
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TodosScreen } from './src/screens/TodosScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ChatScreen } from './src/screens/ChatScreen';

// ... imports
import { NotesScreen } from './src/screens/NotesScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { FloatingAIButton } from './src/components/FloatingAIButton';

// ... (keep context and services)

import { ChatbotContext } from '@/contexts/ChatbotContext';
import FloatingChatbot from '@/components/FloatingChatbot';

import { translations, useEffectiveLanguage } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';

// Lazy load services that aren't needed immediately
let notificationService: any = null;
let authService: any = null;
let securityService: any = null;
let syncManager: any = null;
let subscriptionService: any = null;

// Load services asynchronously
const loadServices = async () => {
  if (!authService) {
    const auth = await import('./src/services/authService');
    authService = auth.authService;
  }
  if (!syncManager) {
    const sync = await import('./src/services/sync/SyncManager');
    syncManager = sync.syncManager;
  }
  if (!securityService) {
    const security = await import('./src/services/securityService');
    securityService = security.securityService;
  }
  if (!notificationService) {
    const notifications = await import('./src/services/notificationService');
    notificationService = notifications.notificationService;
  }
  if (!subscriptionService) {
    const subs = await import('./src/services/SubscriptionService');
    subscriptionService = subs.subscriptionService;
  }
  return { authService, securityService, notificationService, syncManager, subscriptionService };
};

// ... (keep context and services)

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Loading fallback component
const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const AuthStack = () => {
  const { skipToMain } = useContext(SkipLoginContext);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding">
        {() => <OnboardingScreen onComplete={skipToMain} />}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const lang = useEffectiveLanguage();
  const t = translations[lang];
  const { colors: themeColors } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary[500],
        tabBarInactiveTintColor: themeColors.text.muted.light,
        tabBarStyle: {
          backgroundColor: themeColors.card.light,
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: t.home,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Todos"
        component={TodosScreen}
        options={{
          tabBarLabel: t.tasks,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: t.calendar,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: t.notes,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarLabel: t.expenses,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Stack to handle Modal and Settings outside of Tabs (if we want to hide tabs/button)
// For now, consistent with requester's "Setting pages" exception, we can keep Settings as a screen in RootStack or just conditional render FAB.
// The user said: "change it to Floating and movable Icon every page besides setting pages"
// Moving Settings to a Stack screen makes it easier to hide content from the "MainTabs" view.
import { PaywallScreen } from './src/screens/PaywallScreen';

// ... other imports

const AuthenticatedNavigation = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="Settings" component={SettingsScreen} />
    <RootStack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
    {/* Auth screens accessible when authenticated (e.g. for guest to login conversion) */}
    <RootStack.Screen name="Login" component={LoginScreen} />
    <RootStack.Screen name="Register" component={RegisterScreen} />
    <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </RootStack.Navigator>
);

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>('Home');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Skip login function for development
  const skipToMain = () => {
    setIsAuthenticated(true);
  };

  // Check authentication status on mount and listen for changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkAuth = async () => {
      try {
        // Load services asynchronously - but don't block on errors
        try {
          const services = await loadServices();
          setServicesLoaded(true);

          // Initialize sync manager and subscriptions
          services.syncManager.initialize().catch(console.error);
          services.subscriptionService.initialize().catch(console.error);

          let session = null;
          try {
            session = await services.authService.getSession();
            if (session?.user) {
              services.subscriptionService.identify(session.user.id);
            }
          } catch (e) {
            console.log('Session restore failed, signing out...', e);
            await supabase.auth.signOut().catch(() => { });
          }

          // Check for offline profile
          const userProfile = await AsyncStorage.getItem('user_profile');

          // Authenticated if session exists OR offline profile exists
          setIsAuthenticated(!!session || !!userProfile);

          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (session) {
              setIsAuthenticated(true);
              // Reset sync manager to pull data for new user
              services.syncManager.reset().catch(console.error);
              // Identify user for IAP
              services.subscriptionService.identify(session.user.id);
            } else {
              // If no session, check if we are in guest mode (offline profile)
              // Only sign out if NO session AND NO guest profile
              const userProfile = await AsyncStorage.getItem('user_profile');
              setIsAuthenticated(!!userProfile);
              // Clear IAP user
              services.subscriptionService.logout();
            }

            // Initialize or cleanup security service based on auth state
            if (session && services.securityService) {
              services.securityService.initialize().then(() => {
                services.securityService.setLockCallback(() => {
                  setIsAuthenticated(false);
                });
              }).catch(console.error);
            } else if (services.securityService) {
              services.securityService.cleanup();
            }
          });

          unsubscribe = () => subscription.unsubscribe();

          // Initialize security service if authenticated
          if (session && services.securityService) {
            await services.securityService.initialize().catch(console.error);

            // Set up auto-lock callback
            services.securityService.setLockCallback(() => {
              // Lock the app by signing out
              setIsAuthenticated(false);
            });
          }
        } catch (serviceError) {
          console.error('Failed to load services:', serviceError);
          // Continue without services - allow skip login to work
          setServicesLoaded(false);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setIsAuthenticated(false);
      } finally {
        // Always finish loading so the login screen shows
        setIsLoading(false);
      }
    };

    checkAuth();

    // Cleanup security service and auth listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Security cleanup
    };
  }, []);

  // ... (Keep AppState listener logic) ...
  useEffect(() => {
    if (!servicesLoaded || !isAuthenticated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (securityService) {
          securityService.handleAppStateChange(nextAppState);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [servicesLoaded, isAuthenticated]);


  // Deep linking configuration
  const linking = {
    prefixes: ['dailypa://', 'https://dailypa.app'],
    config: {
      screens: {
        // Auth screens
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
        // Main tabs (nested in MainTabs screen of RootStack)
        MainTabs: {
          screens: {
            Home: 'home',
            Todos: {
              path: 'todos/:todoId?',
              parse: { todoId: (id: string) => id },
            },
            Calendar: {
              path: 'calendar/:eventId?',
              parse: { eventId: (id: string) => id },
            },
            Expenses: 'expenses',
            Notes: 'notes',
          },
        },
        Settings: 'settings',
      },
    },
  };

  // ... (Keep Notifications logic) ...
  useEffect(() => {
    if (!isAuthenticated || !servicesLoaded) return;
    const setupNotifications = async () => {
      if (!notificationService) return;
      await notificationService.registerForPushNotifications();
      const subscription = notificationService.addNotificationResponseListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          if (data?.type === 'todo' && data?.todoId) {
            navigationRef.current?.navigate('MainTabs', { screen: 'Todos', params: { todoId: data.todoId } });
          } else if (data?.type === 'calendar_event' && data?.eventId) {
            navigationRef.current?.navigate('MainTabs', { screen: 'Calendar', params: { eventId: data.eventId } });
          }
        }
      );
      return subscription;
    };
    let sub: any;
    setupNotifications().then(s => sub = s);
    return () => sub?.remove();
  }, [isAuthenticated, servicesLoaded]);


  if (isLoading) {
    return <LoadingFallback />;
  }

  const getActiveRouteName = (state: any): string => {
    if (!state || !state.routes) return 'Unknown';
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRouteName(route.state);
    }
    return route.name;
  };

  const shouldShowFAB = () => {
    // Hide on Settings, Login, Register, etc
    // If we are in MainTabs, we show it.
    // If we are in Settings (which is now a stack screen), we hide it.
    const hiddenScreens = ['Settings', 'Login', 'Register', 'ForgotPassword'];
    return !hiddenScreens.includes(currentRouteName || '');
  };

  const chatContextValue = {
    openChatbot: () => setIsChatbotOpen(true),
    closeChatbot: () => setIsChatbotOpen(false),
    isChatbotOpen
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SkipLoginContext.Provider value={{ skipToMain }}>
          <ChatbotContext.Provider value={chatContextValue}>
            <ErrorBoundary>
              <NavigationContainer
                ref={navigationRef}
                linking={linking as any}
                onStateChange={(state) => {
                  const routeName = getActiveRouteName(state);
                  setCurrentRouteName(routeName);
                }}
              >
                {isAuthenticated ? <AuthenticatedNavigation /> : <AuthStack />}
                <StatusBar style="dark" />
                {isAuthenticated && shouldShowFAB() && <FloatingAIButton />}
              </NavigationContainer>
              {isAuthenticated && <FloatingChatbot visible={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />}
            </ErrorBoundary>
          </ChatbotContext.Provider>
        </SkipLoginContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

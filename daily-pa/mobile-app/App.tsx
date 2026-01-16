/**
 * Daily PA Mobile App
 * Main application entry point
 * Optimized for fast launch time with lazy loading
 */

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SkipLoginContext } from './src/contexts/SkipLoginContext';
import { supabase } from './src/services/supabase';
import { GlassBottomNav } from './src/components/navigation/GlassBottomNav';
import { FloatingChatbot } from './src/components/FloatingChatbot';

// Lazy load screens for faster initial load
// Auth screens are loaded immediately as they're needed first
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';

// Direct imports to avoid caching issues
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TodosScreen } from './src/screens/TodosScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Chatbot context for global access
export const ChatbotContext = createContext<{
  openChatbot: () => void;
  closeChatbot: () => void;
}>({
  openChatbot: () => {},
  closeChatbot: () => {},
});

export const useChatbot = () => useContext(ChatbotContext);

// Lazy load services that aren't needed immediately
let notificationService: any = null;
let authService: any = null;
let securityService: any = null;

// Load services asynchronously
const loadServices = async () => {
  if (!authService) {
    const auth = await import('./src/services/authService');
    authService = auth.authService;
  }
  if (!securityService) {
    const security = await import('./src/services/securityService');
    securityService = security.securityService;
  }
  if (!notificationService) {
    const notifications = await import('./src/services/notificationService');
    notificationService = notifications.notificationService;
  }
  return { authService, securityService, notificationService };
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading fallback component
const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const MainTabs = ({ onChatbotPress }: { onChatbotPress: () => void }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
      tabBar={(props) => {
        const currentRoute = props.state.routes[props.state.index].name;
        
        return (
          <GlassBottomNav
            currentRoute={currentRoute}
            onNavigate={(routeName) => {
              const route = props.state.routes.find((r) => r.name === routeName);
              if (route) {
                props.navigation.navigate(route.name);
              }
            }}
            onChatbotPress={onChatbotPress}
            isChatbotOpen={false}
          />
        );
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Todos" component={TodosScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Chatbot controls
  const openChatbot = () => setIsChatbotOpen(true);
  const closeChatbot = () => setIsChatbotOpen(false);

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
          
          const session = await services.authService.getSession();
          setIsAuthenticated(!!session);
          
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            setIsAuthenticated(!!session);
            
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
      if (securityService) {
        securityService.cleanup();
      }
    };
  }, []);

  // Handle app state changes for auto-lock
  useEffect(() => {
    if (!servicesLoaded || !isAuthenticated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - check if should lock
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
        // Main tabs
        Home: 'home',
        Todos: {
          path: 'todos/:todoId?',
          parse: {
            todoId: (todoId: string) => todoId,
          },
        },
        Expenses: {
          path: 'expenses/:expenseId?',
          parse: {
            expenseId: (expenseId: string) => expenseId,
          },
        },
        Calendar: {
          path: 'calendar/:eventId?',
          parse: {
            eventId: (eventId: string) => eventId,
          },
        },
        Settings: 'settings',
      },
    },
  };

  // Register for notifications after authentication (lazy loaded)
  useEffect(() => {
    if (!isAuthenticated || !servicesLoaded) {
      return;
    }

    // Load notification service and register
    const setupNotifications = async () => {
      if (!notificationService) {
        return;
      }

      await notificationService.registerForPushNotifications();

      // Add notification response listener (when user taps notification)
      const subscription = notificationService.addNotificationResponseListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          
          // Navigate based on notification type
          if (data?.type === 'todo' && data?.todoId) {
            // Navigate to Todos tab
            navigationRef.current?.navigate('Todos', { todoId: data.todoId });
          } else if (data?.type === 'calendar_event' && data?.eventId) {
            // Navigate to Calendar tab
            navigationRef.current?.navigate('Calendar', { eventId: data.eventId });
          }
        }
      );

      return subscription;
    };

    let subscription: any;
    setupNotifications().then(sub => {
      subscription = sub;
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isAuthenticated, servicesLoaded]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <SkipLoginContext.Provider value={{ skipToMain }}>
      <ChatbotContext.Provider value={{ openChatbot, closeChatbot }}>
        <ErrorBoundary>
          <NavigationContainer ref={navigationRef} linking={linking}>
            {isAuthenticated ? <MainTabs onChatbotPress={openChatbot} /> : <AuthStack />}
            <StatusBar style="dark" />
          </NavigationContainer>
          <FloatingChatbot visible={isChatbotOpen} onClose={closeChatbot} />
        </ErrorBoundary>
      </ChatbotContext.Provider>
    </SkipLoginContext.Provider>
  );
}

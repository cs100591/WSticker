import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WelcomeScreen } from '@/screens/WelcomeScreen'; // New Import
import { DashboardScreen } from '@/screens/DashboardScreen';
import { TodosScreen } from '@/screens/TodosScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { NotesScreen } from '@/screens/NotesScreen';
import { SkipLoginContext } from '@/contexts/SkipLoginContext';
import { FloatingAIButton } from '@/components/FloatingAIButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 0,
        height: 80,
        paddingBottom: 20,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
      lazy: true,
    }}
  >
    <Tab.Screen
      name="Home"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
      }}
    />
    <Tab.Screen
      name="Todos"
      component={TodosScreen}
      options={{
        tabBarLabel: 'Tasks',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>✓</Text>,
      }}
    />
    <Tab.Screen
      name="Calendar"
      component={CalendarScreen}
      options={{
        tabBarLabel: 'Calendar',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📅</Text>,
      }}
    />
    <Tab.Screen
      name="Notes"
      component={NotesScreen}
      options={{
        tabBarLabel: 'Notes',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📝</Text>,
      }}
    />
    <Tab.Screen
      name="Expenses"
      component={ExpensesScreen}
      options={{
        tabBarLabel: 'Expenses',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💰</Text>,
      }}
    />
  </Tab.Navigator>
);

const AppStack = ({ initialRouteName }: { initialRouteName: string }) => (
  <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
    {/* Welcome Screen is the first screen if not finished tutorial/setup */}
    <RootStack.Screen name="Welcome" component={WelcomeScreen} />
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="Settings" component={SettingsScreen} />
    <RootStack.Screen
      name="AIChatModal"
      component={ChatScreen}
      options={{
        presentation: 'modal',
        animation: 'slide_from_bottom'
      }}
    />
  </RootStack.Navigator>
);

export const AppNavigator = () => {
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        // If hasLaunched is set, go to MainTabs, otherwise Welcome
        if (hasLaunched === 'true') {
          setInitialRoute('MainTabs');
        } else {
          setInitialRoute('Welcome');
        }
      } catch (e) {
        setInitialRoute('Welcome');
      }
    };
    checkFirstLaunch();
  }, []);

  const getActiveRouteName = (state: NavigationState | undefined): string => {
    if (!state || !state.routes) return 'Unknown';
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRouteName(route.state as NavigationState);
    }
    return route.name;
  };

  const shouldShowFAB = () => {
    const hiddenScreens = ['Settings', 'AIChatModal', 'Welcome'];
    if (!currentRouteName) return false;
    return !hiddenScreens.includes(currentRouteName);
  };

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SkipLoginContext.Provider value={{ skipToMain: () => { } }}>
      <NavigationContainer
        onStateChange={(state) => {
          const routeName = getActiveRouteName(state);
          setCurrentRouteName(routeName);
        }}
      >
        <AppStack initialRouteName={initialRoute} />
        {shouldShowFAB() && <FloatingAIButton />}
      </NavigationContainer>
    </SkipLoginContext.Provider>
  );
};

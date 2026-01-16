/**
 * App Navigator
 * Main navigation structure for the app
 */

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { TodosScreen } from '@/screens/TodosScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SkipLoginContext } from '@/contexts/SkipLoginContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
    {/* Home/Dashboard is the main screen */}
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
        tabBarLabel: 'Todos',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>✓</Text>,
      }}
    />
    <Tab.Screen 
      name="AIChat" 
      component={ChatScreen}
      options={{
        tabBarLabel: 'AI',
        tabBarIcon: ({ focused }) => (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#3B82F6',
            backgroundColor: focused ? '#3B82F6' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 18, color: focused ? '#FFF' : '#3B82F6' }}>✨</Text>
          </View>
        ),
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
      name="Expenses" 
      component={ExpensesScreen}
      options={{
        tabBarLabel: 'Expenses',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💰</Text>,
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const [isSkipLogin, setIsSkipLogin] = useState(false);

  const skipToMain = () => {
    setIsSkipLogin(true);
  };

  return (
    <SkipLoginContext.Provider value={{ skipToMain }}>
      <NavigationContainer>
        {isSkipLogin ? (
          <MainTabs />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SkipLoginContext.Provider>
  );
};

/**
 * Dashboard Screen (Home)
 * Main overview screen showing:
 * - Todo summary
 * - Today's schedule
 * - Expenses summary
 * Matches web app dashboard functionality
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalStore, Todo, CalendarEvent } from '@/models';
import * as Location from 'expo-location';
import { weatherService, WeatherData } from '@/services/weatherService';
import { WeatherHeader } from '@/components/WeatherHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { CompactTimeline } from '@/components/CompactTimeline';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useThemeStore } from '@/store/themeStore';
import { FONTS } from '@/theme/fonts';
import { LinearGradient } from 'expo-linear-gradient';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const lang = useEffectiveLanguage();
  const t = translations[lang];
  const { colors: themeColors, mode } = useThemeStore();
  const currencySymbol = useCurrencyStore((state) => state.getSymbol());

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const weatherData = await weatherService.getWeather(
          location.coords.latitude,
          location.coords.longitude
        );
        setWeather(weatherData);
      } catch (error) {
        console.log('Error fetching weather info:', error);
      }
    })();
  }, []);

  const { greeting: weatherGreeting, emoji: weatherEmoji } = useMemo(
    () => weatherService.getGreetingAndEmoji(weather),
    [weather]
  );

  // Get raw data from Zustand store (select arrays directly, not methods)
  const allTodos = useLocalStore((state) => state.todos);
  const allCalendarEvents = useLocalStore((state) => state.calendarEvents);
  const allExpenses = useLocalStore((state) => state.expenses);

  // Filter deleted items with useMemo to prevent re-renders
  const todos = useMemo(() => allTodos.filter((t) => !t.isDeleted), [allTodos]);
  const calendarEvents = useMemo(() => allCalendarEvents.filter((e) => !e.isDeleted), [allCalendarEvents]);
  const expenses = useMemo(() => allExpenses.filter((e) => !e.isDeleted), [allExpenses]);

  // Calculate stats
  const activeTodos = todos.filter((t) => t.status === 'active');
  const completedTodos = todos.filter((t) => t.status === 'completed');
  const completionRate = todos.length > 0
    ? Math.round((completedTodos.length / todos.length) * 100)
    : 0;

  // Get today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter today's events
  const todayEvents = calendarEvents.filter((e) => {
    if (!e.startTime || !e.title) return false;
    try {
      const eventDate = new Date(e.startTime);
      if (isNaN(eventDate.getTime())) return false;
      return eventDate >= today && eventDate < tomorrow;
    } catch {
      return false;
    }
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Get this month's expenses
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const monthlyExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.expenseDate);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });
  const monthlySpending = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Data is reactive from Zustand, just simulate refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // Mock data for preview when store is empty
  const displayTodos = activeTodos.length > 0 ? activeTodos.slice(0, 5) : [
    { id: '1', title: 'Complete project report', priority: 'high', status: 'active', dueDate: new Date().toISOString() },
    { id: '2', title: 'Review team feedback', priority: 'medium', status: 'active', dueDate: null },
    { id: '3', title: 'Schedule meeting with client', priority: 'low', status: 'active', dueDate: null },
  ] as Todo[];

  const displayEvents = todayEvents.length > 0 ? todayEvents : [
    { id: '1', title: 'Team Standup', startTime: new Date(new Date().setHours(9, 0)).toISOString(), endTime: new Date(new Date().setHours(9, 30)).toISOString(), allDay: false },
    { id: '2', title: 'Project Review', startTime: new Date(new Date().setHours(14, 0)).toISOString(), endTime: new Date(new Date().setHours(15, 0)).toISOString(), allDay: false },
  ] as CalendarEvent[];

  const displayMonthlySpending = monthlySpending > 0 ? monthlySpending : 1250;
  const displayActiveTasks = activeTodos.length > 0 ? activeTodos.length : 8;
  const displayCompletionRate = todos.length > 0 ? completionRate : 65;
  const displayEventsToday = todayEvents.length > 0 ? todayEvents.length : 3;

  // Theme check
  const isGlassy = mode !== 'minimal';
  const gradientColors = useMemo(() => {
    return [themeColors.gradient.start, themeColors.gradient.middle, themeColors.gradient.end];
  }, [themeColors]);

  return (
    <View style={[styles.container, isGlassy && { backgroundColor: 'transparent' }]}>
      {/* Weather Header within Global Gradient Context if possible, but Dashboard has custom layout. 
          Actually, let's wrap Dashboard in a format related to ScreenContainer but custom. 
          For now, we apply the gradient manually if isSage to match other screens, 
          OR we assume the user wants the exact layout from HTML. 
          The user said "apply to all screen". 
          We should defer to ScreenContainer or apply gradient here. 
      */}
      {isGlassy && (
        <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
          <LinearGradient
            colors={gradientColors as any}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Header */}
      <WeatherHeader
        weather={weather}
        greeting={(t as any)[weatherGreeting] || weatherGreeting}
        emoji={weatherEmoji}
        style={isGlassy ? { backgroundColor: 'transparent', borderBottomWidth: 0, paddingTop: 60 } : undefined}
      >
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color="#6B7280" />
        </TouchableOpacity>
      </WeatherHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Timeline - Shows events only */}
        <CompactTimeline 
          events={displayEvents.map(e => ({
            id: e.id,
            title: e.title,
            startTime: formatTime(e.startTime),
            endTime: formatTime(e.endTime),
            color: '#3B82F6',
          }))}
        />

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>{t.todaysSchedule}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Calendar' as never)}>
              <Text style={[styles.viewAllLink, { color: themeColors.primary[500] }]}>{t.openCalendar} →</Text>
            </TouchableOpacity>
          </View>
          <AnimatedCard variant="default">
            {displayEvents.length > 0 ? (
              displayEvents.map((event, index) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventItem,
                    index < displayEvents.length - 1 && styles.eventItemBorder,
                  ]}
                >
                  <View style={styles.eventTime}>
                    <Text style={styles.eventTimeText}>
                      {event.allDay ? 'All Day' : formatTime(event.startTime)}
                    </Text>
                  </View>
                  <View style={styles.eventContent}>
                    <View style={styles.eventDot} />
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {!event.allDay && (
                        <Text style={styles.eventDuration}>
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyText}>{t.noEventsToday}</Text>
              </View>
            )}
          </AnimatedCard>
        </View>

        {/* Priority Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.priorityTasks}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Todos' as never)}>
              <Text style={[styles.viewAllLink, { color: themeColors.primary[500] }]}>{t.viewAll} →</Text>
            </TouchableOpacity>
          </View>
          <AnimatedCard variant="default">
            {displayTodos.map((todo, index) => (
              <View
                key={todo.id}
                style={[
                  styles.todoItem,
                  index < displayTodos.length - 1 && styles.todoItemBorder,
                ]}
              >
                <View style={styles.todoCheckbox} />
                <View style={styles.todoContent}>
                  <Text style={styles.todoTitle} numberOfLines={1}>
                    {todo.title}
                  </Text>
                  <View style={styles.todoMeta}>
                    {allCalendarEvents.some(e => e.todoId === todo.id) && (
                      <Ionicons name="calendar" size={14} color="#3B82F6" style={{ marginRight: 6 }} />
                    )}
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(todo.priority) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: getPriorityColor(todo.priority) },
                        ]}
                      >
                        {todo.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </AnimatedCard>
        </View>

        {/* Expenses Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.expensesThisMonth}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses' as never)}>
              <Text style={[styles.viewAllLink, { color: themeColors.primary[500] }]}>{t.viewAll} →</Text>
            </TouchableOpacity>
          </View>
          <AnimatedCard variant="default" style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTotal}>{currencySymbol}{displayMonthlySpending.toFixed(2)}</Text>
              <Text style={styles.expenseLabel}>{t.totalSpentMsg}</Text>
            </View>
            <View style={styles.expenseCategories}>
              <View style={styles.categoryItem}>
                <Ionicons name="fast-food-outline" size={24} color="#94A3B8" />
                <Text style={styles.categoryName}>{t.food}</Text>
              </View>
              <View style={styles.categoryItem}>
                <Ionicons name="car-outline" size={24} color="#94A3B8" />
                <Text style={styles.categoryName}>{t.transport}</Text>
              </View>
              <View style={styles.categoryItem}>
                <Ionicons name="cart-outline" size={24} color="#94A3B8" />
                <Text style={styles.categoryName}>{t.shopping}</Text>
              </View>
              <View style={styles.categoryItem}>
                <Ionicons name="game-controller-outline" size={24} color="#94A3B8" />
                <Text style={styles.categoryName}>{t.entertainment}</Text>
              </View>
            </View>
          </AnimatedCard>
        </View>

        {/* Stats Grid - Bento Style */}
        <View style={styles.bentoGrid}>
          {/* Large card - Tasks */}
          <AnimatedCard variant="default" style={[styles.bentoCard, styles.bentoLarge]}>
            <View style={styles.bentoHeader}>
              <View style={[styles.bentoIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="checkbox" size={20} color="#FFF" />
              </View>
              <Text style={styles.bentoLabel}>{t.activeTasks}</Text>
            </View>
            <Text style={styles.bentoValueLarge}>{displayActiveTasks}</Text>
            <Text style={styles.bentoSubtext}>{t.completionRate}: {displayCompletionRate}%</Text>
          </AnimatedCard>

          {/* Small card - Completion */}
          <AnimatedCard variant="default" style={[styles.bentoCard, styles.bentoSmall]}>
            <View style={[styles.bentoIconSmall, { backgroundColor: '#10B981' }]}>
              <Ionicons name="trending-up" size={18} color="#FFF" />
            </View>
            <Text style={styles.bentoValue}>{displayCompletionRate}%</Text>
            <Text style={styles.bentoLabelSmall}>Done</Text>
          </AnimatedCard>

          {/* Small card - Expenses */}
          <AnimatedCard variant="default" style={[styles.bentoCard, styles.bentoSmall]}>
            <View style={[styles.bentoIconSmall, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="wallet" size={18} color="#FFF" />
            </View>
            <Text style={styles.bentoValue}>{currencySymbol}{displayMonthlySpending.toFixed(0)}</Text>
            <Text style={styles.bentoLabelSmall}>This Month</Text>
          </AnimatedCard>

          {/* Large card - Events */}
          <AnimatedCard variant="default" style={[styles.bentoCard, styles.bentoLarge]}>
            <View style={styles.bentoHeader}>
              <View style={[styles.bentoIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="calendar" size={20} color="#FFF" />
              </View>
              <Text style={styles.bentoLabel}>{t.eventsToday}</Text>
            </View>
            <Text style={styles.bentoValueLarge}>{displayEventsToday}</Text>
            <Text style={styles.bentoSubtext}>Events today</Text>
          </AnimatedCard>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  bentoCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bentoLarge: {
    width: '100%',
  },
  bentoSmall: {
    width: '48%',
    minHeight: 120,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bentoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  bentoIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bentoLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#64748B',
  },
  bentoLabelSmall: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#94A3B8',
    marginTop: 4,
  },
  bentoValueLarge: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  bentoValue: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  bentoSubtext: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#3B82F6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  todoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#0F172A',
    marginBottom: 4,
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoMetaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  eventItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  eventTime: {
    width: 60,
    marginRight: 12,
  },
  eventTimeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#94A3B8',
    textAlign: 'right',
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    borderLeftWidth: 2,
    borderLeftColor: '#BFDBFE',
    paddingLeft: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    left: -5,
    top: 4,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#0F172A',
    marginBottom: 2,
  },
  eventDuration: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
  expenseCard: {
    backgroundColor: '#1E293B',
  },
  expenseHeader: {
    marginBottom: 16,
  },
  expenseTotal: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#fff',
    marginBottom: 4,
  },
  expenseLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  expenseCategories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

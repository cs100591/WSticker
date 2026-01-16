/**
 * Calendar Screen
 * Main screen for viewing calendar events with month/week/day views
 * Shows event list below calendar when date is selected
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalStore, CalendarEvent } from '@/models';
import { calendarService, CalendarView } from '@/services/CalendarService';
import { EventForm, EventFormData } from '@/components/EventForm';
import { ScreenHeader } from '@/components/ScreenHeader';
import { supabase } from '@/services/supabase';

// Simple Month Calendar Component (no internal scroll)
const SimpleMonthView: React.FC<{
  currentDate: Date;
  events: Array<{ id: string; title: string; startTime: string; color?: string }>;
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}> = ({ currentDate, events, onDateSelect, selectedDate }) => {
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const days: Date[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate();
    });
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={monthStyles.container}>
      <View style={monthStyles.weekDaysRow}>
        {weekDays.map(day => (
          <View key={day} style={monthStyles.weekDayCell}>
            <Text style={monthStyles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
      <View style={monthStyles.calendarGrid}>
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isSelected = isSameDay(date, selectedDate);
          return (
            <TouchableOpacity
              key={index}
              style={[
                monthStyles.dayCell,
                isSelected && monthStyles.selectedDay,
                isToday(date) && monthStyles.todayCell,
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[
                monthStyles.dayText,
                !isCurrentMonth(date) && monthStyles.otherMonthText,
                isToday(date) && monthStyles.todayText,
                isSelected && monthStyles.selectedDayText,
              ]}>
                {date.getDate()}
              </Text>
              {dayEvents.length > 0 && (
                <View style={monthStyles.eventDots}>
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <View key={i} style={[monthStyles.eventDot, { backgroundColor: e.color || '#3B82F6' }]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};


const monthStyles = StyleSheet.create({
  container: { backgroundColor: '#fff', paddingBottom: 8 },
  weekDaysRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  weekDayCell: { flex: 1, alignItems: 'center' },
  weekDayText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 50, padding: 2, borderWidth: 0.5, borderColor: '#e5e7eb', alignItems: 'center' },
  selectedDay: { backgroundColor: '#dbeafe' },
  todayCell: { borderColor: '#3b82f6', borderWidth: 2 },
  dayText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  otherMonthText: { color: '#d1d5db' },
  todayText: { color: '#3b82f6', fontWeight: '700' },
  selectedDayText: { color: '#1e40af', fontWeight: '700' },
  eventDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  eventDot: { width: 6, height: 6, borderRadius: 3 },
});

export const CalendarScreen: React.FC = React.memo(() => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  // Select raw data from store, not methods (prevents infinite re-renders)
  const rawEvents = useLocalStore((state) => state.calendarEvents);
  // const addCalendarEvent = useLocalStore((state) => state.addCalendarEvent); // Use service instead
  const setCalendarEvents = useLocalStore((state) => state.setCalendarEvents);
  const [userId, setUserId] = useState('mock-user-id');

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadEvents = async () => {
        try {
          const events = await calendarService.getEvents({ userId });
          setCalendarEvents(events);
        } catch (error) {
          console.error('Failed to load events', error);
        }
      };
      loadEvents();
    }, [userId])
  );

  // Filter deleted events with useMemo
  const allEvents = useMemo(() => rawEvents.filter((e) => !e.isDeleted), [rawEvents]);

  const getEventsForSelectedDate = useCallback(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    return allEvents.filter((e) => {
      const eventStart = new Date(e.startTime);
      const eventEnd = new Date(e.endTime);
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  }, [allEvents, selectedDate]);

  const selectedDateEvents = getEventsForSelectedDate();

  // Mock events for preview
  const mockEvents: CalendarEvent[] = [
    { id: 'mock-1', userId, title: 'Team Meeting', description: 'Weekly sync', startTime: new Date(new Date().setHours(10, 0)).toISOString(), endTime: new Date(new Date().setHours(11, 0)).toISOString(), allDay: false, source: 'local', color: '#3B82F6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
    { id: 'mock-2', userId, title: 'Lunch Break', description: 'Lunch', startTime: new Date(new Date().setHours(12, 30)).toISOString(), endTime: new Date(new Date().setHours(13, 30)).toISOString(), allDay: false, source: 'local', color: '#10B981', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
    { id: 'mock-3', userId, title: 'Project Review', description: 'Review', startTime: new Date(new Date().setHours(15, 0)).toISOString(), endTime: new Date(new Date().setHours(16, 30)).toISOString(), allDay: false, source: 'local', color: '#F59E0B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false },
  ];

  const displayEvents = allEvents.length > 0 ? allEvents : mockEvents;
  const displaySelectedDateEvents = selectedDateEvents.length > 0 ? selectedDateEvents : mockEvents;

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    if (currentView === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (currentView === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (currentView === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (currentView === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const getHeaderTitle = (): string => {
    if (currentView === 'month') return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (currentView === 'week') {
      const range = calendarService.getWeekRange(selectedDate);
      return `${range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleAddEvent = async (data: EventFormData) => {
    try {
      await calendarService.createEvent({
        userId,
        title: data.title,
        description: data.description || '',
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        allDay: data.allDay,
        source: 'local',
        color: data.color || '#3B82F6',
      });
      setShowAddModal(false);
      // No need to reload events manually, local store updates automatically
    } catch (error) {
      console.error('Failed to add event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <ScreenHeader
          title="Calendar"
          rightContent={
            <TouchableOpacity style={styles.addEventButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addEventButtonText}>+ Add</Text>
            </TouchableOpacity>
          }
        />

        {/* Navigation */}
        <View style={styles.calendarControls}>
          <Text style={styles.periodTitle}>{getHeaderTitle()}</Text>
          <View style={styles.navigationRow}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
              <Ionicons name="chevron-back-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.todayButton} onPress={() => setSelectedDate(new Date())}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Ionicons name="chevron-forward-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <View style={styles.viewSwitcher}>
            {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
              <TouchableOpacity
                key={view}
                style={[styles.viewButton, currentView === view && styles.viewButtonActive]}
                onPress={() => setCurrentView(view)}
              >
                <Text style={[styles.viewButtonText, currentView === view && styles.viewButtonTextActive]}>
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Calendar Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        nestedScrollEnabled={true}
      >
        {/* Month View - Simple inline calendar */}
        {currentView === 'month' && (
          <>
            <SimpleMonthView
              currentDate={selectedDate}
              events={displayEvents}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />

            {/* Event List for Selected Date */}
            <View style={styles.eventListContainer}>
              <Text style={styles.eventListTitle}>
                Events on {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              {displaySelectedDateEvents.length > 0 ? (
                displaySelectedDateEvents.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={[styles.eventIndicator, { backgroundColor: event.color || '#3B82F6' }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {event.allDay ? 'All Day' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                      </Text>
                      {event.description && <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noEventsContainer}>
                  <Text style={styles.noEventsText}>No events on this day</Text>
                  <TouchableOpacity style={styles.addEventSmallButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addEventSmallButtonText}>+ Add Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* Week/Day Views - Show simple list */}
        {(currentView === 'week' || currentView === 'day') && (
          <View style={styles.simpleListContainer}>
            <Text style={styles.simpleListTitle}>
              {currentView === 'week' ? 'This Week' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            {displayEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={[styles.eventIndicator, { backgroundColor: event.color || '#3B82F6' }]} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.allDay ? 'All Day' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Event</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close-outline" size={28} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <EventForm
            initialData={{ startTime: selectedDate, endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000) }}
            onSubmit={handleAddEvent}
            onCancel={() => setShowAddModal(false)}
            submitLabel="Create Event"
          />
        </View>
      </Modal>
    </View>
  );
});


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  calendarControls: { paddingBottom: 16 },
  periodTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A', textAlign: 'center', marginBottom: 12 },
  navigationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 12, gap: 16 },
  navButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#F8FAFC' },
  todayButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#3B82F6' },
  todayButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  addEventButton: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addEventButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  viewSwitcher: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  viewButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  viewButtonActive: { backgroundColor: '#3B82F6' },
  viewButtonText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  viewButtonTextActive: { color: '#fff' },
  content: { flex: 1 },
  eventListContainer: { padding: 20, backgroundColor: '#fff', marginTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  eventListTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  eventItem: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  eventIndicator: { width: 4, borderRadius: 2, marginRight: 12 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  eventTime: { fontSize: 13, color: '#3B82F6', fontWeight: '500', marginBottom: 4 },
  eventDescription: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  noEventsContainer: { alignItems: 'center', paddingVertical: 24 },
  noEventsText: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  addEventSmallButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addEventSmallButtonText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  simpleListContainer: { padding: 20, backgroundColor: '#fff' },
  simpleListTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 16 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 50 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
});

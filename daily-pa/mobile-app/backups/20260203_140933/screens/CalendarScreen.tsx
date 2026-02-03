/**
 * Calendar Screen Pro
 * Advanced calendar with split view, themes, and robust sync
 * Re-designed to match specific visual requirements:
 * - Large Month Header
 * - Custom Grid Styling with Text Events
 * - specific "New Schedule" button layout
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';


import { useLocalStore, CalendarEvent } from '@/models';
import { calendarService, CalendarView } from '@/services/CalendarService';
import { EventForm, EventFormData } from '@/components/EventForm';
import { CalendarSelector } from '@/components/CalendarSelector'; // Added
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Components ---

// --- Components ---

const VIEW_MODES = ['List', 'Day', 'Week', 'Month'];

/**
 * Check if an event overlaps with a given day.
 * SIMPLIFIED: All-day events are stored with correct end times at sync time,
 * so we just need a simple overlap check.
 */
const eventOverlapsDay = (event: CalendarEvent, dayDate: Date): boolean => {
  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);

  const dayStart = new Date(dayDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Simple overlap: event starts before day ends AND event ends after day starts
  return eventStart <= dayEnd && eventEnd >= dayStart;
};


const BlockMonthView: React.FC<{
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  themeColors: any;
  isMinimal: boolean;
  isGlassy: boolean;
}> = ({ currentDate, events, onDateSelect, selectedDate, themeColors, isMinimal, isGlassy }) => {
  const lang = useEffectiveLanguage();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Prev Month Days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current Month Days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    return days;
  };

  const dayData = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (date: Date) => isSameDay(date, new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.monthContainer}>
      <View style={styles.weekheader}>
        {weekDays.map((day, i) => (
          <Text key={i} style={[styles.weekDayText, { color: themeColors.text.secondary.light }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {dayData.map((item, index) => {
          const { date, isCurrentMonth } = item;
          const isSel = isSameDay(date, selectedDate);
          const isTdy = isToday(date);

          // Use shared helper to correctly handle all-day events with exclusive end times
          const cellEvents = events.filter(e => eventOverlapsDay(e, date)).sort((a, b) => {
            const startA = new Date(a.startTime).getTime();
            const startB = new Date(b.startTime).getTime();
            if (startA !== startB) return startA - startB;
            const durA = new Date(a.endTime).getTime() - startA;
            const durB = new Date(b.endTime).getTime() - startB;
            return durB - durA;
          });

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSel && styles.selectedDayCell,
                isSel && isGlassy && { backgroundColor: themeColors.primary[500] }
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[
                styles.dayNumber,
                !isCurrentMonth && styles.mutedText,
                isTdy && !isSel && styles.todayText,
                isSel && styles.selectedDayText
              ]}>
                {date.getDate()}
              </Text>

              <View style={styles.eventContainer}>
                {cellEvents.slice(0, 3).map((ev, i) => {
                  const eStart = new Date(ev.startTime);
                  const eEnd = new Date(ev.endTime);
                  const yesterday = new Date(date); yesterday.setDate(date.getDate() - 1);
                  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
                  const continuesFromPrev = eStart < dayStart && date.getDay() !== 0;
                  const tomorrow = new Date(date); tomorrow.setDate(date.getDate() + 1);
                  const startOfTomorrow = new Date(tomorrow); startOfTomorrow.setHours(0, 0, 0, 0);
                  const continuesToNext = eEnd > startOfTomorrow && date.getDay() !== 6;
                  const isMultiDay = continuesFromPrev || continuesToNext;

                  const baseColor = ev.color || '#10B981';
                  const lighten = (col: string, amount: number) => {
                    if (!col.startsWith('#')) return col;
                    try {
                      const num = parseInt(col.replace('#', ''), 16);
                      const r = (num >> 16) + amount * (255 - (num >> 16));
                      const g = ((num >> 8) & 0x00FF) + amount * (255 - ((num >> 8) & 0x00FF));
                      const b = (num & 0x0000FF) + amount * (255 - (num & 0x0000FF));
                      return `#${(0x1000000 + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
                    } catch (e) { return col; }
                  };
                  const solidPastelColor = lighten(baseColor, 0.7);

                  const barStyle: any = {
                    backgroundColor: solidPastelColor,
                    height: 18,
                    marginBottom: 2,
                    justifyContent: 'center',
                    borderRadius: 4,
                    marginHorizontal: 2,
                  };

                  let containerStyle: any = { marginBottom: 2 };
                  if (isMultiDay) {
                    barStyle.marginHorizontal = 0;
                    containerStyle = { height: 20, width: '100%', marginBottom: 0, position: 'relative' };
                    if (continuesFromPrev) {
                      barStyle.borderTopLeftRadius = 0;
                      barStyle.borderBottomLeftRadius = 0;
                      barStyle.marginLeft = -1;
                      barStyle.width = '105%';
                      containerStyle.marginLeft = 0;
                      containerStyle.width = '100%';
                    }
                    if (continuesToNext) {
                      barStyle.borderTopRightRadius = 0;
                      barStyle.borderBottomRightRadius = 0;
                      if (!continuesFromPrev) barStyle.width = '105%';
                    }
                    if (continuesFromPrev && continuesToNext) {
                      barStyle.width = '110%';
                      barStyle.marginLeft = -1;
                    }
                  }

                  return (
                    <View key={i} style={containerStyle}>
                      <View style={[barStyle, { overflow: 'hidden' }]}>
                        <Text numberOfLines={1} style={[styles.miniEventText, { color: '#0F172A', marginLeft: 4, fontSize: 10, fontWeight: '500' }]}>
                          {ev.title}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View >
  );
};


const BlockWeekView: React.FC<{
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
  themeColors: any;
  viewRef?: React.Ref<View>;
}> = ({ currentDate, events, selectedDate, onDateSelect, themeColors, viewRef }) => {
  const startOfWeek = new Date(selectedDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day;
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();

  return (
    <View style={styles.weekContainer}>
      <View style={styles.weekHeaderRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
          <Text key={i} style={styles.weekHeaderLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.weekGrid} ref={viewRef}>
        {weekDays.map((d, i) => {
          const isSel = isSameDay(d, selectedDate);
          const isTdy = isSameDay(d, new Date());

          return (
            <TouchableOpacity
              key={i}
              style={[styles.weekDayCell, isSel && styles.selectedDayCell]}
              onPress={() => onDateSelect(d)}
            >
              <Text style={[
                styles.dayNumber,
                isSel && styles.selectedDayText,
                isTdy && !isSel && styles.todayText
              ]}>{d.getDate()}</Text>
              <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                {events.filter(e => eventOverlapsDay(e, d)).slice(0, 3).map((_, idx) => (
                  <View key={idx} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSel ? '#fff' : '#10B981' }} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const CalendarScreen: React.FC = React.memo(() => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const storeUserId = useUserStore(state => state.profile.id);
  const [userId, setUserId] = useState(storeUserId || 'guest_user');

  React.useEffect(() => {
    setUserId(storeUserId || 'guest_user');
  }, [storeUserId]);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation<any>();
  const lang = useEffectiveLanguage();
  const t = translations[lang];
  const { colors: themeColors, mode } = useThemeStore();
  const isMinimal = mode === 'minimal';
  const isGlassy = !isMinimal;
  const gradient = useMemo(() => {
    return [themeColors.gradient.start, themeColors.gradient.middle, themeColors.gradient.end];
  }, [themeColors]);

  const rawCalendarEvents = useLocalStore((state) => state.calendarEvents);

  const calendarEvents = useMemo(() => {
    let events = rawCalendarEvents.filter(e => !e.isDeleted);

    // CRITICAL: Display-layer deduplication to guarantee no visual duplicates
    // On Android, same events appear from multiple synced calendars (Google + Samsung + Exchange)
    // Use date-only fingerprint for timezone robustness
    const seen = new Map<string, CalendarEvent>();
    for (const e of events) {
      const startDate = new Date(e.startTime).toISOString().split('T')[0];
      const endDate = new Date(e.endTime).toISOString().split('T')[0];
      const fingerprint = `${(e.title || '').toLowerCase().trim()}_${startDate}_${endDate}`;

      const existing = seen.get(fingerprint);
      // Priority: local > manual > device (prefer user-created over synced)
      const sourcePriority = (s?: string) => s === 'local' ? 3 : s === 'manual' ? 2 : 1;
      if (!existing || sourcePriority(e.source) > sourcePriority(existing.source)) {
        seen.set(fingerprint, e);
      }
    }
    events = Array.from(seen.values());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return events;
  }, [rawCalendarEvents, searchQuery]);

  const selectedDateEvents = useMemo(() => {
    // Use shared helper to correctly handle all-day events with exclusive end times
    return calendarEvents
      .filter(e => !e.isDeleted)
      .filter(e => eventOverlapsDay(e, selectedDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [selectedDate, calendarEvents]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await calendarService.syncWithDevice(userId);
    } catch (e) {
      Alert.alert(
        'Sync Failed',
        'Please check your calendar permissions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
    setRefreshing(false);
  };

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      await calendarService.createEvent({
        ...data,
        userId,
        source: 'local',
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      });
      setShowAddModal(false);
    } catch (e) { Alert.alert('Error', 'Failed to create'); }
  };

  const handleUpdateEvent = async (data: EventFormData) => {
    if (!editEvent) return;
    try {
      await calendarService.updateEvent(editEvent, {
        ...data,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      });
      setEditEvent(null);
    } catch (e) { Alert.alert('Error', 'Failed to update'); }
  };

  const handleDeleteEvent = async () => {
    if (!editEvent) return;
    await calendarService.deleteEvent(editEvent);
    setEditEvent(null);
  };

  const handleEventUpdate = async (event: CalendarEvent, startDate: Date, endDate: Date) => {
    // Basic update logic handling (placeholder if needed)
  };

  const handleEventDrop = (event: CalendarEvent, date: Date) => {
    // Placeholder for potential future drag-drop logic
  };

  const renderAgendaItem = ({ item }: { item: CalendarEvent }) => {
    const startTime = new Date(item.startTime).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={[
          styles.agendaItem,
          isGlassy && { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderBottomWidth: 0, shadowColor: 'rgba(0,0,0,0.03)', shadowOpacity: 1, shadowRadius: 10, marginHorizontal: 20, marginBottom: 12 }
        ]}
        onPress={() => setEditEvent(item)}
      >
        <View style={styles.agendaLeft}>
          <Text style={styles.agendaTime}>{startTime}</Text>
        </View>
        <View style={[styles.agendaCard, { borderLeftColor: item.color || '#3B82F6', backgroundColor: isGlassy ? 'transparent' : '#F8FAFC' }]}>
          <Text style={styles.agendaTitle}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isGlassy ? 'transparent' : '#fff' }]}>
      {isGlassy && (
        <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
          <LinearGradient
            colors={gradient as any}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* --- Top Navigation Header --- */}
      <View style={[styles.topNavContainer, isGlassy && { backgroundColor: 'transparent', borderBottomWidth: 0 }]}>
        <View style={styles.monthNavRow}>
          {showSearch ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, marginRight: 12 }}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 16, color: '#0F172A' }}
                placeholder="Search events..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navArrow}>
                <Ionicons name="chevron-back" size={24} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.navMonthTitle}>
                {selectedDate.toLocaleDateString(lang, { year: 'numeric', month: 'long' })}
              </Text>

              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navArrow}>
                <Ionicons name="chevron-forward" size={24} color="#0F172A" />
              </TouchableOpacity>
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center', marginLeft: showSearch ? 0 : 'auto' }}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Ionicons name={showSearch ? "search" : "search-outline"} size={22} color={showSearch ? "#3B82F6" : "#0F172A"} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCalendarSelector(true)}>
              <Ionicons name="calendar-outline" size={22} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.viewTabsRow}>
          {['List', 'Day', 'Week', 'Month'].map(m => {
            const isActive = viewMode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.viewTab, isActive && styles.viewTabActive]}
                onPress={() => setViewMode(m)}
              >
                <Text style={[styles.viewTabText, isActive && styles.viewTabTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {viewMode === 'Month' && (
          <BlockMonthView
            currentDate={selectedDate}
            selectedDate={selectedDate}
            events={calendarEvents}
            onDateSelect={setSelectedDate}
            themeColors={themeColors}
            isMinimal={isMinimal}
            isGlassy={isGlassy}
          />
        )}

        {viewMode === 'Week' && (
          <BlockWeekView
            currentDate={selectedDate}
            selectedDate={selectedDate}
            events={calendarEvents}
            onDateSelect={setSelectedDate}
            themeColors={themeColors}
          />
        )}

        {viewMode === 'List' ? (
          <View style={styles.listContainer}>
            {calendarEvents
              .filter(e => new Date(e.startTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 50)
              .map((item, index, arr) => {
                const dateLabel = new Date(item.startTime).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
                const prevDateLabel = index > 0 ? new Date(arr[index - 1].startTime).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' }) : '';
                const showHeader = dateLabel !== prevDateLabel;

                return (
                  <View key={item.id}>
                    {showHeader && (
                      <Text style={styles.listHeaderDate}>{dateLabel}</Text>
                    )}
                    {renderAgendaItem({ item })}
                  </View>
                );
              })
            }
            {calendarEvents.length === 0 && <Text style={{ textAlign: 'center', marginTop: 20 }}>No upcoming events</Text>}
          </View>
        ) : (
          <View style={styles.agendaSection}>
            <Text style={styles.agendaSectionTitle}>
              {selectedDate.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.newScheduleBtn} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add" size={20} color="#0F172A" />
                <Text style={styles.newScheduleText}>{t.newTask || 'New Schedule'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              {selectedDateEvents.map(item => (
                <View key={item.id}>
                  {renderAgendaItem({ item })}
                </View>
              ))}
              {selectedDateEvents.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8' }}>{t.noEventsToday}</Text>
                </View>
              )}
            </View>

            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

      <Modal visible={showCalendarSelector} animationType="slide" presentationStyle="formSheet">
        <CalendarSelector
          onClose={() => setShowCalendarSelector(false)}
          onSync={() => handleRefresh()}
        />
      </Modal>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="formSheet">
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setShowAddModal(false)}
          submitLabel={t.add}
        />
      </Modal>

      <Modal visible={!!editEvent} animationType="slide" presentationStyle="formSheet">
        {editEvent && (
          <EventForm
            initialData={{
              title: editEvent.title,
              description: editEvent.description,
              startTime: new Date(editEvent.startTime),
              endTime: new Date(editEvent.endTime),
              allDay: editEvent.allDay,
              color: editEvent.color
            }}
            onSubmit={handleUpdateEvent}
            onCancel={() => setEditEvent(null)}
            onDelete={handleDeleteEvent}
            submitLabel={t.save}
          />
        )}
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Navigation
  topNavContainer: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navArrow: {
    padding: 4,
  },
  navMonthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
    marginRight: 8,
  },
  viewTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  viewTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewTabActive: {
    borderBottomColor: '#3B82F6',
  },
  viewTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  viewTabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Week View
  weekContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekHeaderLabel: { width: '14.28%', textAlign: 'center', fontSize: 12, color: '#94A3B8' },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  weekDayText: { textAlign: 'center', width: '14.28%', fontSize: 13, fontWeight: '600' },

  // Month
  monthContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  weekheader: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 100, // Fixed height to enlarge calendar
    paddingTop: 8,
    alignItems: 'center',
    borderRightWidth: 1, // Optional: add grid lines if desired, but not requested. Keeping simple.
    borderColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 4,
  },
  mutedText: {
    color: '#94A3B8', // Darker gray for better visibility
  },
  todayText: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Events in Month
  eventContainer: {
    width: '100%',
    paddingHorizontal: 0, // Removed padding to allow continuous bars
    marginTop: 2,
  },
  miniEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  miniEventBar: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginRight: 4,
  },
  miniEventText: {
    fontSize: 10,
    color: '#334155',
    flex: 1,
  },

  // List View
  listContainer: {
    paddingBottom: 40,
  },
  listHeaderDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderRadius: 4,
    marginLeft: 16,
  },

  // Agenda / Day View
  agendaSection: {
    paddingTop: 16,
  },
  agendaSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  newScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20, // Rounded
  },
  newScheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 6,
  },
  agendaItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  agendaLeft: {
    width: 60,
    alignItems: 'center',
    paddingTop: 2,
  },
  agendaTime: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  agendaCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  agendaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
});

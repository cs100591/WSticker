import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface MonthViewProps {
  currentDate: Date;
  events: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
  }>;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  selectedDate,
}) => {
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDayOfWeek = firstDay.getDay();
    const days: Date[] = [];
    
    // Add padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add padding days from next month
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const truncateTitle = (title: string, maxLength: number = 6): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 2) + '..';
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView style={styles.container}>
      {/* Week day headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map(day => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDay,
                isTodayDate && styles.todayCell,
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonthDate && styles.otherMonthText,
                  isTodayDate && styles.todayText,
                  isSelected && styles.selectedDayText,
                ]}
              >
                {date.getDate()}
              </Text>
              
              {/* Event bars - show up to 2 events with titles */}
              <View style={styles.eventBarsContainer}>
                {dayEvents.slice(0, 2).map((event) => (
                  <View
                    key={event.id}
                    style={[
                      styles.eventBar,
                      { backgroundColor: event.color || '#3b82f6' },
                    ]}
                  >
                    <Text style={styles.eventBarText} numberOfLines={1}>
                      {truncateTitle(event.title)}
                    </Text>
                  </View>
                ))}
                {dayEvents.length > 2 && (
                  <Text style={styles.moreEventsText}>+{dayEvents.length - 2}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  weekDaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    minHeight: 70,
    padding: 2,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#dbeafe',
  },
  todayCell: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#111827',
    marginBottom: 2,
  },
  otherMonthText: {
    color: '#d1d5db',
  },
  todayText: {
    color: '#3b82f6',
    fontFamily: 'Poppins_700Bold',
  },
  selectedDayText: {
    color: '#1e40af',
    fontFamily: 'Poppins_700Bold',
  },
  eventBarsContainer: {
    width: '100%',
    paddingHorizontal: 1,
    gap: 1,
  },
  eventBar: {
    width: '100%',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
    marginBottom: 1,
  },
  eventBarText: {
    fontSize: 8,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
  },
  moreEventsText: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

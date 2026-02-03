import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface WeekViewProps {
  currentDate: Date;
  events: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
  }>;
  onEventPress?: (eventId: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventPress,
}) => {
  const getWeekDays = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day; // Get Sunday of the week
    const sunday = new Date(date);
    sunday.setDate(diff);
    
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventPosition = (event: { startTime: Date; endTime: Date }) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = startHour * 60; // 60px per hour
    const height = Math.max((endHour - startHour) * 60, 30); // Minimum 30px
    
    return { top, height };
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Week day headers */}
      <View style={styles.headerRow}>
        <View style={styles.timeColumn} />
        {weekDays.map((day, index) => (
          <View key={index} style={styles.dayHeader}>
            <Text style={styles.dayName}>
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dayNumber, isToday(day) && styles.todayNumber]}>
              {day.getDate()}
            </Text>
          </View>
        ))}
      </View>

      {/* Timeline */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.timelineContainer}>
          {/* Time labels and grid */}
          {hours.map(hour => (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </Text>
              </View>
              {weekDays.map((_, dayIndex) => (
                <View key={dayIndex} style={styles.hourCell} />
              ))}
            </View>
          ))}

          {/* Events overlay */}
          <View style={styles.eventsOverlay}>
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              return (
                <View key={dayIndex} style={[styles.dayColumn, { left: `${60 + dayIndex * ((100 - 60) / 7)}%` }]}>
                  {dayEvents.map(event => {
                    const { top, height } = getEventPosition(event);
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventBlock,
                          {
                            top,
                            height,
                            backgroundColor: event.color || '#3b82f6',
                          },
                        ]}
                        onPress={() => onEventPress?.(event.id)}
                      >
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        <Text style={styles.eventTime} numberOfLines={1}>
                          {formatTime(new Date(event.startTime))}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  todayNumber: {
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  timelineContainer: {
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  hourCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  eventsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dayColumn: {
    position: 'absolute',
    top: 0,
    width: '12%',
    height: '100%',
  },
  eventBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 4,
    padding: 4,
    overflow: 'hidden',
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  eventTime: {
    fontSize: 10, // Increased from 9 for better accessibility
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
});

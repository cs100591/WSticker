import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface DayViewProps {
  currentDate: Date;
  events: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    color?: string;
    description?: string;
  }>;
  onEventPress?: (eventId: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventPress,
}) => {
  const getEventsForDay = () => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getDate() === currentDate.getDate()
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
    
    const top = startHour * 80; // 80px per hour for better spacing
    const height = Math.max((endHour - startHour) * 80, 40); // Minimum 40px
    
    return { top, height };
  };

  const dayEvents = getEventsForDay();
  const allDayEvents = dayEvents.filter(e => e.allDay);
  const timedEvents = dayEvents.filter(e => !e.allDay);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <View style={styles.allDaySection}>
          <Text style={styles.allDayLabel}>All Day</Text>
          <View style={styles.allDayEvents}>
            {allDayEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.allDayEvent,
                  { backgroundColor: event.color || '#3b82f6' },
                ]}
                onPress={() => onEventPress?.(event.id)}
              >
                <Text style={styles.allDayEventText} numberOfLines={1}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Hourly schedule */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.scheduleContainer}>
          {/* Time grid */}
          {hours.map(hour => (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </Text>
              </View>
              <View style={styles.hourContent}>
                <View style={styles.halfHourLine} />
              </View>
            </View>
          ))}

          {/* Events overlay */}
          <View style={styles.eventsOverlay}>
            {timedEvents.map(event => {
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
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventTime}>
                      {formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}
                    </Text>
                    {event.description && (
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {event.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
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
  allDaySection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  allDayLabel: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#6b7280',
    marginBottom: 8,
  },
  allDayEvents: {
    gap: 4,
  },
  allDayEvent: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  allDayEventText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scheduleContainer: {
    position: 'relative',
    paddingBottom: 20,
  },
  hourRow: {
    flexDirection: 'row',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timeColumn: {
    width: 70,
    paddingTop: 4,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: FONTS.medium,
  },
  hourContent: {
    flex: 1,
    position: 'relative',
  },
  halfHourLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f9fafb',
  },
  eventsOverlay: {
    position: 'absolute',
    top: 0,
    left: 70,
    right: 0,
    bottom: 0,
  },
  eventBlock: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 6,
    padding: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#fff',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
});

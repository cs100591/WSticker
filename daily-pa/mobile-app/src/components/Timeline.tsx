/**
 * Timeline Component - Tiimo-style daily schedule
 * Shows 6AM-11PM timeline with events
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TimelineEvent {
  id: string;
  title: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  color?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  currentTime?: string; // "14:30"
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6AM to 11PM

export const Timeline: React.FC<TimelineProps> = ({ events, currentTime }) => {
  const getEventPosition = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutesFrom6AM = (startHour - 6) * 60 + startMin;
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    const top = (startMinutesFrom6AM / 60) * 60 + 30; // 30px header offset
    const height = (durationMinutes / 60) * 60;
    
    return { top, height };
  };

  const getCurrentTimePosition = () => {
    if (!currentTime) return null;
    const [hour, min] = currentTime.split(':').map(Number);
    const minutesFrom6AM = (hour - 6) * 60 + min;
    return (minutesFrom6AM / 60) * 60 + 30;
  };

  const currentPosition = getCurrentTimePosition();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Timeline</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.timelineContainer}>
          {/* Time labels column */}
          <View style={styles.timeColumn}>
            {HOURS.map(hour => (
              <View key={hour} style={styles.timeSlot}>
                <Text style={styles.timeLabel}>
                  {hour <= 12 ? `${hour}AM` : `${hour - 12}PM`}
                </Text>
              </View>
            ))}
          </View>

          {/* Events area */}
          <View style={styles.eventsArea}>
            {/* Hour grid lines */}
            {HOURS.map(hour => (
              <View 
                key={`line-${hour}`} 
                style={[styles.hourLine, { top: (hour - 6) * 60 + 30 }]}
              />
            ))}

            {/* Current time indicator */}
            {currentPosition && (
              <View style={[styles.currentTimeLine, { top: currentPosition }]}>
                <View style={styles.currentTimeDot} />
              </View>
            )}

            {/* Events */}
            {events.map(event => {
              const { top, height } = getEventPosition(event.startTime, event.endTime);
              return (
                <View
                  key={event.id}
                  style={[
                    styles.eventBlock,
                    { 
                      top, 
                      height,
                      backgroundColor: event.color || '#3B82F6',
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[event.color || '#3B82F6', `${event.color || '#3B82F6'}CC`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventTime}>
                    {event.startTime} - {event.endTime}
                  </Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  timelineContainer: {
    flexDirection: 'row',
    height: 18 * 60 + 30, // 18 hours * 60px + header
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  timeColumn: {
    width: 50,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingTop: 30,
  },
  timeSlot: {
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  eventsArea: {
    flex: 1,
    width: 280,
    position: 'relative',
    paddingTop: 30,
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EF4444',
    zIndex: 10,
  },
  currentTimeDot: {
    position: 'absolute',
    left: -4,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  eventBlock: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 10,
    padding: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});

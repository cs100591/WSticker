/**
 * Compact Timeline - Only shows events, no empty hours
 * Clean, focused event list
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

interface CompactTimelineProps {
  events: TimelineEvent[];
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({ events }) => {
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  if (sortedEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No events today</Text>
        <Text style={styles.emptySubtext}>Add events to see them here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Schedule</Text>
        <Text style={styles.count}>{sortedEvents.length} events</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.eventsContainer}>
          {sortedEvents.map((event, index) => {
            const [startHour, startMin] = event.startTime.split(':').map(Number);
            const [endHour, endMin] = event.endTime.split(':').map(Number);
            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            const width = Math.max(120, (durationMinutes / 60) * 80); // Min 120px, scale by hour
            
            return (
              <View key={event.id} style={styles.eventWrapper}>
                {/* Time label */}
                <Text style={styles.timeLabel}>
                  {event.startTime}
                </Text>
                
                {/* Event card */}
                <View style={[styles.eventCard, { width, backgroundColor: event.color || '#3B82F6' }]}>
                  <LinearGradient
                    colors={[event.color || '#3B82F6', `${event.color || '#3B82F6'}DD`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    borderRadius={14}
                  />
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventTime}>
                    {event.startTime} - {event.endTime}
                  </Text>
                </View>
                
                {/* Connector line */}
                {index < sortedEvents.length - 1 && (
                  <View style={styles.connector} />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  eventsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventWrapper: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  eventCard: {
    minHeight: 70,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  connector: {
    width: 20,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 35,
  },
  emptyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

/**
 * Compact Timeline - Only shows events, no empty hours
 * Clean, focused event list
 * Supports Minimal theme with outline style
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

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
  const { colors: themeColors } = useThemeStore();
  
  // Get theme color for outline style
  const themeColor = themeColors.primary[500] || '#3B82F6';
  
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  if (sortedEvents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { 
        borderColor: themeColor,
        backgroundColor: 'transparent' 
      }]}>
        <Text style={[styles.emptyText, { color: themeColor }]}>
          No events today
        </Text>
        <Text style={styles.emptySubtext}>Add events to see them here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColor }]}>Today's Schedule</Text>
        <Text style={[styles.count, { color: themeColor, opacity: 0.7 }]}>
          {sortedEvents.length} events
        </Text>
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
                <Text style={[styles.timeLabel, { color: themeColor }]}>
                  {event.startTime}
                </Text>
                
                {/* Event card - Always outline style with theme color */}
                <View style={[
                  styles.eventCard, 
                  { 
                    width,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: event.color || themeColor,
                    shadowOpacity: 0,
                    elevation: 0,
                  }
                ]}>
                  <Text style={[
                    styles.eventTitle, 
                    { color: event.color || themeColor }
                  ]} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={[
                    styles.eventTime,
                    { color: event.color || themeColor, opacity: 0.7 }
                  ]}>
                    {event.startTime} - {event.endTime}
                  </Text>
                </View>
                
                {/* Connector line */}
                {index < sortedEvents.length - 1 && (
                  <View style={[
                    styles.connector,
                    { backgroundColor: themeColor, opacity: 0.3 }
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

import { FONTS } from '@/theme/fonts';

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
    fontFamily: FONTS.bold,
    color: '#1E293B',
  },
  count: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.semiBold,
    color: '#64748B',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: FONTS.regular,
  },
});

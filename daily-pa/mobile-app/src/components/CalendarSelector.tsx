import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calendarService } from '@/services/CalendarService';

interface CalendarSelectorProps {
    onClose: () => void;
    onSync: () => void;
}

export const CalendarSelector: React.FC<CalendarSelectorProps> = ({ onClose, onSync }) => {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allCalendars = await calendarService.getAvailableCalendars();
            const visible = await calendarService.getVisibleCalendarIds();

            setCalendars(allCalendars);
            setVisibleIds(new Set(visible.length > 0 ? visible : allCalendars.map(c => c.id)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleCalendar = async (id: string) => {
        const newSet = new Set(visibleIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setVisibleIds(newSet);

        // Auto save
        await calendarService.saveVisibleCalendarIds(Array.from(newSet));
    };

    const handleClose = () => {
        onSync(); // Trigger sync/refresh on close
        onClose();
    };

    // Group by source/account
    const groupedCalendars = calendars.reduce((acc: any, cal: any) => {
        const sourceName = cal.source?.name || 'Local';
        if (!acc[sourceName]) acc[sourceName] = [];
        acc[sourceName].push(cal);
        return acc;
    }, {});

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.title}>Calendars</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {calendars.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="warning-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No calendars found</Text>
                        <Text style={styles.emptySubtext}>
                            If you are using Expo Go on iOS, native calendar access is limited.
                        </Text>
                    </View>
                )}
                {Object.keys(groupedCalendars).map((sourceName) => (
                    <View key={sourceName} style={styles.section}>
                        <Text style={styles.sectionTitle}>{sourceName}</Text>
                        {groupedCalendars[sourceName].map((cal: any) => (
                            <TouchableOpacity
                                key={cal.id}
                                style={styles.row}
                                onPress={() => toggleCalendar(cal.id)}
                            >
                                <View style={[styles.colorDot, { backgroundColor: cal.color }]} />
                                <Text style={styles.calTitle}>{cal.title}</Text>

                                {visibleIds.has(cal.id) && (
                                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                                )}
                                {!visibleIds.has(cal.id) && (
                                    <View style={styles.uncheckedCircle} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    closeBtn: { padding: 8 },
    content: { flex: 1, padding: 16 },
    section: { marginBottom: 24, backgroundColor: '#fff', borderRadius: 12, padding: 8 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 8,
        marginTop: 8
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    calTitle: { flex: 1, fontSize: 16, color: '#0F172A' },
    uncheckedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0'
    },
    emptyState: { alignItems: 'center', padding: 32, marginTop: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#64748B', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 }
});

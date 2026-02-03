/**
 * Auto Notification Scheduler
 * Handles automated notification scheduling:
 * 1. Daily reminder 1 hour before first event
 * 2. Inactive user reminder after 3-5 days
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';
import { CalendarEventRepository } from './repositories/CalendarEventRepository';

// Storage keys
const LAST_APP_OPEN_KEY = '@auto_notif_last_app_open';
const NOTIFICATION_IDS_KEY = '@auto_notif_scheduled_ids';

// Notification ID prefixes
const DAILY_REMINDER_PREFIX = 'daily_first_event_';
const INACTIVE_REMINDER_PREFIX = 'inactive_reminder_';

// Greeting messages
const MORNING_GREETINGS = [
    'Good morning! ☀️',
    'Rise and shine! 🌅',
    'Hello! 👋',
    'Great day ahead! 🌟',
];

const INACTIVE_MESSAGES = {
    day3: {
        title: 'We miss you! 👋',
        body: 'Open Clasp to check your upcoming schedule and stay organized.',
    },
    day5: {
        title: "It's been a while! 📅",
        body: "Don't forget to plan your week. Tap to see what's coming up.",
    },
};

class AutoNotificationScheduler {
    private scheduledIds: string[] = [];

    /**
     * Initialize - load saved notification IDs
     */
    async initialize(): Promise<void> {
        try {
            const ids = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
            this.scheduledIds = ids ? JSON.parse(ids) : [];
        } catch (e) {
            this.scheduledIds = [];
        }
    }

    /**
     * Record when the app was opened
     */
    async recordAppOpen(): Promise<void> {
        try {
            const now = new Date().toISOString();
            await AsyncStorage.setItem(LAST_APP_OPEN_KEY, now);
            console.log('[AutoNotif] Recorded app open:', now);
        } catch (e) {
            console.warn('[AutoNotif] Failed to record app open:', e);
        }
    }

    /**
     * Get a random greeting message
     */
    private getRandomGreeting(): string {
        const index = Math.floor(Math.random() * MORNING_GREETINGS.length);
        return MORNING_GREETINGS[index];
    }

    /**
     * Schedule notification for 1 hour before today's first event
     */
    async scheduleDailyFirstEventReminder(userId: string): Promise<void> {
        try {
            // Cancel any existing daily reminders
            await this.cancelNotificationsByPrefix(DAILY_REMINDER_PREFIX);

            // Get today's date range
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            // Get all events for today
            const events = await CalendarEventRepository.findByDateRange(
                userId,
                startOfDay.toISOString(),
                endOfDay.toISOString()
            );

            if (events.length === 0) {
                console.log('[AutoNotif] No events today, skipping daily reminder');
                return;
            }

            // Sort by start time and find the first future event
            const sortedEvents = events
                .filter(e => new Date(e.startTime) > now)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            if (sortedEvents.length === 0) {
                console.log('[AutoNotif] No future events today, skipping daily reminder');
                return;
            }

            const firstEvent = sortedEvents[0];
            const eventStart = new Date(firstEvent.startTime);
            const reminderTime = new Date(eventStart.getTime() - 60 * 60 * 1000); // 1 hour before

            // Only schedule if reminder time is in the future
            if (reminderTime <= now) {
                console.log('[AutoNotif] First event reminder time has passed');
                return;
            }

            const greeting = this.getRandomGreeting();
            const title = `${greeting} Your day starts soon!`;
            const body = `Your first event "${firstEvent.title}" starts in 1 hour. Tap to view today's schedule.`;

            const notifId = await notificationService.scheduleNotification(
                title,
                body,
                reminderTime,
                { type: 'daily_reminder', screen: 'Calendar' }
            );

            if (notifId) {
                const fullId = `${DAILY_REMINDER_PREFIX}${notifId}`;
                this.scheduledIds.push(fullId);
                await this.saveScheduledIds();
                console.log('[AutoNotif] Scheduled daily reminder for:', reminderTime.toLocaleString());
            }
        } catch (e) {
            console.warn('[AutoNotif] Failed to schedule daily reminder:', e);
        }
    }

    /**
     * Schedule reminder when user is inactive for 3-5 days
     */
    async scheduleInactiveReminder(): Promise<void> {
        try {
            // Cancel existing inactive reminders
            await this.cancelNotificationsByPrefix(INACTIVE_REMINDER_PREFIX);

            const now = new Date();

            // Schedule 3-day reminder
            const day3Time = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            const notif3Id = await notificationService.scheduleNotification(
                INACTIVE_MESSAGES.day3.title,
                INACTIVE_MESSAGES.day3.body,
                day3Time,
                { type: 'inactive_reminder', screen: 'Home' }
            );

            if (notif3Id) {
                this.scheduledIds.push(`${INACTIVE_REMINDER_PREFIX}3_${notif3Id}`);
            }

            // Schedule 5-day reminder
            const day5Time = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
            const notif5Id = await notificationService.scheduleNotification(
                INACTIVE_MESSAGES.day5.title,
                INACTIVE_MESSAGES.day5.body,
                day5Time,
                { type: 'inactive_reminder', screen: 'Home' }
            );

            if (notif5Id) {
                this.scheduledIds.push(`${INACTIVE_REMINDER_PREFIX}5_${notif5Id}`);
            }

            await this.saveScheduledIds();
            console.log('[AutoNotif] Scheduled inactive reminders for 3 and 5 days');
        } catch (e) {
            console.warn('[AutoNotif] Failed to schedule inactive reminders:', e);
        }
    }

    /**
     * Cancel notifications by prefix
     */
    private async cancelNotificationsByPrefix(prefix: string): Promise<void> {
        try {
            const toCancel = this.scheduledIds.filter(id => id.startsWith(prefix));

            for (const fullId of toCancel) {
                // Extract the actual notification ID (after the prefix)
                const parts = fullId.split('_');
                const notifId = parts[parts.length - 1];
                try {
                    await notificationService.cancelNotification(notifId);
                } catch (e) {
                    // Notification may already be gone
                }
            }

            // Remove from tracked list
            this.scheduledIds = this.scheduledIds.filter(id => !id.startsWith(prefix));
            await this.saveScheduledIds();
        } catch (e) {
            console.warn('[AutoNotif] Failed to cancel notifications:', e);
        }
    }

    /**
     * Save scheduled notification IDs
     */
    private async saveScheduledIds(): Promise<void> {
        try {
            await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(this.scheduledIds));
        } catch (e) {
            console.warn('[AutoNotif] Failed to save notification IDs:', e);
        }
    }

    /**
     * Main entry point - call on app launch
     * Sets up all auto notifications
     */
    async setupAutoNotifications(userId: string): Promise<void> {
        try {
            console.log('[AutoNotif] Setting up auto notifications for user:', userId);

            // Initialize
            await this.initialize();

            // Record app open (resets inactive timer)
            await this.recordAppOpen();

            // Schedule daily first event reminder
            await this.scheduleDailyFirstEventReminder(userId);

            // Schedule inactive user reminders
            await this.scheduleInactiveReminder();

            console.log('[AutoNotif] Auto notifications setup complete');
        } catch (e) {
            console.error('[AutoNotif] Setup failed:', e);
        }
    }
}

export const autoNotificationScheduler = new AutoNotificationScheduler();

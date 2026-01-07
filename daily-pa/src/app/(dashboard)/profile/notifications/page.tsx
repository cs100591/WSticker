'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft, Bell, Mail, MessageSquare, Calendar, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  todoReminders: boolean;
  calendarReminders: boolean;
  expenseAlerts: boolean;
  weeklyReport: boolean;
}

export default function NotificationsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    todoReminders: true,
    calendarReminders: true,
    expenseAlerts: false,
    weeklyReport: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/notifications');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationGroups = [
    {
      title: 'General',
      items: [
        { key: 'emailNotifications' as keyof NotificationSettings, icon: Mail, label: 'Email Notifications', description: 'Receive notifications via email' },
        { key: 'pushNotifications' as keyof NotificationSettings, icon: MessageSquare, label: 'Push Notifications', description: 'Receive push notifications in browser' },
      ],
    },
    {
      title: 'Reminders',
      items: [
        { key: 'todoReminders' as keyof NotificationSettings, icon: Bell, label: 'To-Do Reminders', description: 'Get reminded about upcoming tasks' },
        { key: 'calendarReminders' as keyof NotificationSettings, icon: Calendar, label: 'Calendar Reminders', description: 'Get reminded about events' },
        { key: 'expenseAlerts' as keyof NotificationSettings, icon: DollarSign, label: 'Expense Alerts', description: 'Get notified about spending limits' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { key: 'weeklyReport' as keyof NotificationSettings, icon: Mail, label: 'Weekly Report', description: 'Receive weekly summary via email' },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Notifications" 
        showHomeButton={false}
        leftButton={
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </Link>
        }
      />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
          </div>
        ) : (
          <>
            {notificationGroups.map((group) => (
              <GlassCard key={group.title}>
                <GlassCardHeader>
                  <GlassCardTitle>{group.title}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="space-y-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isEnabled = settings[item.key];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/30 hover:bg-white/50 transition-all duration-200"
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl border-2 flex items-center justify-center',
                          isEnabled ? 'border-purple-500 text-purple-500' : 'border-gray-300 text-gray-400'
                        )}>
                          <Icon className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <button
                          onClick={() => handleToggle(item.key)}
                          className={cn(
                            'relative w-14 h-8 rounded-full transition-colors duration-200',
                            isEnabled ? 'bg-purple-500' : 'bg-gray-300'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200',
                              isEnabled ? 'translate-x-7' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </GlassCardContent>
              </GlassCard>
            ))}

            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 rounded-xl text-center">
                Settings saved successfully!
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
                  Saving...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Save Notification Settings
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

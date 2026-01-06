'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  color: string;
}

const sampleEvents: CalendarEvent[] = [
  { id: '1', title: 'Team Meeting', date: '2026-01-06', time: '10:00', color: 'from-blue-500 to-blue-600' },
  { id: '2', title: 'Client Demo', date: '2026-01-08', time: '14:00', color: 'from-green-500 to-emerald-600' },
  { id: '3', title: 'Project Deadline', date: '2026-01-10', color: 'from-red-500 to-rose-600' },
  { id: '4', title: 'Birthday Party', date: '2026-01-15', time: '19:00', color: 'from-purple-500 to-violet-600' },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { t } = useI18n();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events] = useState<CalendarEvent[]>(sampleEvents);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const getEventsForDate = (dateStr: string) => events.filter((e) => e.date === dateStr);
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.calendar.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Calendar */}
        <GlassCard>
          <GlassCardContent>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl hover:bg-white/50"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {t.common.months[currentMonth]} {currentYear}
                </h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl hover:bg-white/50"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex justify-center mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToToday}
                className="rounded-xl"
              >
                {t.calendar.today}
              </Button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {t.common.weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

                const dateStr = formatDate(currentYear, currentMonth, day);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvents = getEventsForDate(dateStr);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'aspect-square p-1 rounded-xl flex flex-col items-center justify-start transition-all duration-200',
                      isSelected && 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30',
                      isToday && !isSelected && 'bg-blue-50 ring-2 ring-blue-200',
                      !isToday && !isSelected && 'hover:bg-white/80'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isToday && !isSelected && 'text-blue-600',
                    )}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isSelected ? 'bg-white' : 'bg-gradient-to-r ' + event.color
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Selected Date Events */}
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between">
            <GlassCardTitle>
              {selectedDate ? `${t.calendar.eventsOn} ${selectedDate}` : t.calendar.selectDate}
            </GlassCardTitle>
            <Button size="sm" className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <Plus className="w-4 h-4 mr-1" />
              {t.calendar.add}
            </Button>
          </GlassCardHeader>
          <GlassCardContent>
            {selectedDate ? (
              selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors"
                    >
                      <div className={cn('w-1.5 h-12 rounded-full bg-gradient-to-b', event.color)} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {event.time && <p className="text-sm text-gray-500">{event.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.calendar.noEvents}</div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">{t.calendar.clickToView}</div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Upcoming Events */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.calendar.upcoming}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedDate(event.date)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
              >
                <div className={cn('w-1.5 h-12 rounded-full bg-gradient-to-b', event.color)} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {event.date} {event.time && `· ${event.time}`}
                  </p>
                </div>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

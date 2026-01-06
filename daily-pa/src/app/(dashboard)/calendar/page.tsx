'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const eventColors = [
  'from-blue-500 to-blue-600',
  'from-green-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-teal-600',
];

export default function CalendarPage() {
  const { t } = useI18n();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
    color: eventColors[0],
  });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${daysInMonth}`;
      
      const res = await fetch(`/api/calendar?start=${startDate}&end=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth, daysInMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.startTime.startsWith(dateStr));
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return;

    try {
      const startTime = newEvent.allDay 
        ? `${selectedDate}T00:00:00` 
        : `${selectedDate}T${newEvent.startTime}:00`;
      const endTime = newEvent.allDay 
        ? `${selectedDate}T23:59:59` 
        : `${selectedDate}T${newEvent.endTime}:00`;

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startTime,
          endTime,
          allDay: newEvent.allDay,
          color: newEvent.color,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setEvents(prev => [...prev, created]);
        setShowAddModal(false);
        setNewEvent({
          title: '',
          description: '',
          startTime: '09:00',
          endTime: '10:00',
          allDay: false,
          color: eventColors[0],
        });
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

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
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={event.id || i}
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
            <Button 
              size="sm" 
              className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
              onClick={() => setShowAddModal(true)}
              disabled={!selectedDate}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t.calendar.add}
            </Button>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : selectedDate ? (
              selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors group"
                    >
                      <div className={cn('w-1.5 h-12 rounded-full bg-gradient-to-b', event.color)} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {!event.allDay && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.startTime.slice(11, 16)} - {event.endTime.slice(11, 16)}
                          </p>
                        )}
                        {event.allDay && (
                          <p className="text-sm text-gray-500">All day</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No upcoming events</div>
            ) : (
              events.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedDate(event.startTime.slice(0, 10))}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className={cn('w-1.5 h-12 rounded-full bg-gradient-to-b', event.color)} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {event.startTime.slice(0, 10)} {!event.allDay && `· ${event.startTime.slice(11, 16)}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md">
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>Add Event</GlassCardTitle>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                <Input
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <Input
                  placeholder="Optional description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="allDay" className="text-sm text-gray-700">All day event</label>
              </div>

              {!newEvent.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                    <Input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">End Time</label>
                    <Input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {eventColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                      className={cn(
                        'w-8 h-8 rounded-full bg-gradient-to-br',
                        color,
                        newEvent.color === color && 'ring-2 ring-offset-2 ring-blue-500'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim()}
                >
                  Add Event
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

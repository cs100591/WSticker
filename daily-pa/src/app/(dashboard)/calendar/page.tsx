'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Loader2, Trash2, Calendar, LayoutGrid, List, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day' | 'schedule';

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

function getWeekDates(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(diff + i);
    weekDates.push(d);
  }
  return weekDates;
}

const eventColors = [
  { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-500', text: 'text-blue-500' },
  { gradient: 'from-green-500 to-emerald-600', border: 'border-green-500', text: 'text-green-500' },
  { gradient: 'from-purple-500 to-violet-600', border: 'border-purple-500', text: 'text-purple-500' },
  { gradient: 'from-orange-500 to-amber-600', border: 'border-orange-500', text: 'text-orange-500' },
  { gradient: 'from-pink-500 to-rose-600', border: 'border-pink-500', text: 'text-pink-500' },
  { gradient: 'from-cyan-500 to-teal-600', border: 'border-cyan-500', text: 'text-cyan-500' },
];

const hours = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const { t } = useI18n();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
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
    color: eventColors[0]?.gradient || 'from-blue-500 to-blue-600',
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const weekDates = getWeekDates(currentDate);

  // Use ref to track if we've already fetched for current params
  const lastFetchKey = useRef<string>('');

  // Fetch events from API - using primitive values only
  useEffect(() => {
    const fetchKey = `${currentYear}-${currentMonth}-${currentDay}-${viewMode}`;
    
    // Skip if we already fetched for these params
    if (lastFetchKey.current === fetchKey) return;
    lastFetchKey.current = fetchKey;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        let startDate: string, endDate: string;
        
        if (viewMode === 'month') {
          startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
          endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${daysInMonth}`;
        } else if (viewMode === 'week') {
          const tempDate = new Date(currentYear, currentMonth, currentDay);
          const day = tempDate.getDay();
          const diff = tempDate.getDate() - day;
          const weekStart = new Date(tempDate);
          weekStart.setDate(diff);
          const weekEnd = new Date(tempDate);
          weekEnd.setDate(diff + 6);
          startDate = formatDate(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          endDate = formatDate(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
        } else {
          startDate = formatDate(currentYear, currentMonth, currentDay);
          endDate = startDate;
        }
        
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
    };

    fetchEvents();
  }, [currentYear, currentMonth, currentDay, daysInMonth, viewMode]);

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(today);
    setSelectedDate(todayStr);
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.startTime.startsWith(dateStr));
  };

  const getEventsForHour = (dateStr: string, hour: number) => {
    return events.filter((e) => {
      if (!e.startTime.startsWith(dateStr)) return false;
      const eventHour = parseInt(e.startTime.slice(11, 13));
      return eventHour === hour;
    });
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
          color: eventColors[0]?.gradient || 'from-blue-500 to-blue-600',
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

  const getNavigationTitle = () => {
    if (viewMode === 'month') {
      return `${t.common.months[currentMonth]} ${currentYear}`;
    } else if (viewMode === 'week') {
      const start = weekDates[0];
      const end = weekDates[6];
      if (start && end) {
        if (start.getMonth() === end.getMonth()) {
          return `${t.common.months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
        }
        return `${t.common.months[start.getMonth()]} ${start.getDate()} - ${t.common.months[end.getMonth()]} ${end.getDate()}`;
      }
      return 'Week View';
    } else if (viewMode === 'day') {
      return `${t.common.months[currentMonth]} ${currentDate.getDate()}, ${currentYear}`;
    }
    return t.calendar.upcoming;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.calendar.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* View Mode Selector */}
        <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-xl">
          {[
            { mode: 'month' as ViewMode, icon: LayoutGrid, label: 'Month' },
            { mode: 'week' as ViewMode, icon: CalendarDays, label: 'Week' },
            { mode: 'day' as ViewMode, icon: Calendar, label: 'Day' },
            { mode: 'schedule' as ViewMode, icon: List, label: 'Schedule' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1',
                viewMode === mode
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Calendar */}
        <GlassCard>
          <GlassCardContent>
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('prev')}
                className="w-10 h-10 rounded-xl hover:bg-white/50"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </Button>
              <div className="text-center flex-1">
                <h2 className="text-lg font-bold text-gray-900">{getNavigationTitle()}</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('next')}
                className="w-10 h-10 rounded-xl hover:bg-white/50"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </div>

            <div className="flex justify-center mb-4">
              <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl">
                {t.calendar.today}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
              </div>
            ) : viewMode === 'month' ? (
              /* Month View */
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {t.common.weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
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
                        <span className={cn('text-sm font-medium', isToday && !isSelected && 'text-blue-600')}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={event.id || i}
                                className={cn('w-1.5 h-1.5 rounded-full border', isSelected ? 'bg-white border-white' : 'border-current')}
                                style={{ borderColor: isSelected ? undefined : event.color.includes('blue') ? '#3b82f6' : event.color.includes('green') ? '#22c55e' : event.color.includes('purple') ? '#a855f7' : event.color.includes('orange') ? '#f97316' : event.color.includes('pink') ? '#ec4899' : '#06b6d4' }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : viewMode === 'week' ? (
              /* Week View */
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="w-16" />
                    {weekDates.map((date, i) => {
                      const dateStr = formatDate(date.getFullYear(), date.getMonth(), date.getDate());
                      const isToday = dateStr === todayStr;
                      return (
                        <div key={i} className={cn('text-center py-2', isToday && 'bg-blue-50 rounded-lg')}>
                          <div className="text-xs text-gray-400">{t.common.weekDays[i]}</div>
                          <div className={cn('text-lg font-bold', isToday ? 'text-blue-600' : 'text-gray-900')}>
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {hours.slice(6, 22).map((hour) => (
                      <div key={hour} className="grid grid-cols-8 gap-1 border-t border-gray-100">
                        <div className="w-16 text-xs text-gray-400 py-2 text-right pr-2">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        {weekDates.map((date, i) => {
                          const dateStr = formatDate(date.getFullYear(), date.getMonth(), date.getDate());
                          const hourEvents = getEventsForHour(dateStr, hour);
                          return (
                            <div
                              key={i}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setNewEvent(prev => ({ ...prev, startTime: `${hour.toString().padStart(2, '0')}:00` }));
                              }}
                              className="min-h-[40px] hover:bg-blue-50 cursor-pointer rounded"
                            >
                              {hourEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className="text-xs p-1 rounded border-2 border-blue-500 text-blue-600 truncate"
                                >
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : viewMode === 'day' ? (
              /* Day View */
              <div className="max-h-[500px] overflow-y-auto">
                {hours.map((hour) => {
                  const dateStr = formatDate(currentYear, currentMonth, currentDate.getDate());
                  const hourEvents = getEventsForHour(dateStr, hour);
                  return (
                    <div key={hour} className="flex border-t border-gray-100">
                      <div className="w-20 text-sm text-gray-400 py-3 text-right pr-4">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setNewEvent(prev => ({ ...prev, startTime: `${hour.toString().padStart(2, '0')}:00` }));
                          setShowAddModal(true);
                        }}
                        className="flex-1 min-h-[50px] hover:bg-blue-50 cursor-pointer rounded p-1"
                      >
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-2 rounded-lg border-2 border-blue-500 text-blue-600 mb-1"
                          >
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs text-blue-400">
                              {event.startTime.slice(11, 16)} - {event.endTime.slice(11, 16)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Schedule View */
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No upcoming events</div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors group"
                    >
                      <div className="w-1.5 h-12 rounded-full border-2 border-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {event.startTime.slice(0, 10)} {!event.allDay && `· ${event.startTime.slice(11, 16)}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Selected Date Events (for month view) */}
        {viewMode === 'month' && (
          <GlassCard>
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>
                {selectedDate ? `${t.calendar.eventsOn} ${selectedDate}` : t.calendar.selectDate}
              </GlassCardTitle>
              <Button 
                size="sm" 
                variant="outline"
                className="rounded-xl border-2 border-blue-500 text-blue-500 bg-transparent hover:bg-blue-50"
                onClick={() => setShowAddModal(true)}
                disabled={!selectedDate}
              >
                <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
                {t.calendar.add}
              </Button>
            </GlassCardHeader>
            <GlassCardContent>
              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors group"
                    >
                      <div className="w-1.5 h-12 rounded-full border-2 border-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {!event.allDay && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            {event.startTime.slice(11, 16)} - {event.endTime.slice(11, 16)}
                          </p>
                        )}
                        {event.allDay && <p className="text-sm text-gray-500">All day</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {selectedDate ? t.calendar.noEvents : t.calendar.clickToView}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md">
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>Add Event</GlassCardTitle>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" strokeWidth={1.5} />
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
                  {eventColors.map((colorObj) => (
                    <button
                      key={colorObj.gradient}
                      onClick={() => setNewEvent(prev => ({ ...prev, color: colorObj.gradient }))}
                      className={cn(
                        'w-8 h-8 rounded-full border-2',
                        colorObj.border,
                        newEvent.color === colorObj.gradient && 'ring-2 ring-offset-2 ring-blue-500'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowAddModal(false)}>
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

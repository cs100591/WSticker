'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Loader2, Trash2, Calendar, LayoutGrid, List, CalendarDays, RefreshCw, Cloud, CloudOff } from 'lucide-react';
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

// Event bar colors - soft but distinct
const eventBarColors: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
};

const eventColors = [
  { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-500', text: 'text-blue-500', key: 'blue' },
  { gradient: 'from-green-500 to-emerald-600', border: 'border-green-500', text: 'text-green-500', key: 'green' },
  { gradient: 'from-purple-500 to-violet-600', border: 'border-purple-500', text: 'text-purple-500', key: 'purple' },
  { gradient: 'from-orange-500 to-amber-600', border: 'border-orange-500', text: 'text-orange-500', key: 'orange' },
  { gradient: 'from-pink-500 to-rose-600', border: 'border-pink-500', text: 'text-pink-500', key: 'pink' },
  { gradient: 'from-cyan-500 to-teal-600', border: 'border-cyan-500', text: 'text-cyan-500', key: 'cyan' },
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

function getColorKey(colorGradient: string): string {
  // Handle gradient format like "from-blue-500 to-blue-600"
  if (colorGradient.includes('blue')) return 'blue';
  if (colorGradient.includes('green') || colorGradient.includes('emerald')) return 'green';
  if (colorGradient.includes('purple') || colorGradient.includes('violet')) return 'purple';
  if (colorGradient.includes('orange')) return 'orange';
  if (colorGradient.includes('amber')) return 'amber';
  if (colorGradient.includes('pink') || colorGradient.includes('rose')) return 'pink';
  if (colorGradient.includes('red')) return 'red';
  if (colorGradient.includes('cyan') || colorGradient.includes('teal')) return 'cyan';
  return 'blue';
}

function getColors(colorGradient: string): { bg: string; text: string; border: string } {
  const colorKey = getColorKey(colorGradient);
  const colors = eventBarColors[colorKey];
  if (colors) return colors;
  return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
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

const hours = Array.from({ length: 24 }, (_, i) => i);

// Helper to get day index in week (0-6)
function getDayIndex(date: Date, weekStartDate: Date): number {
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const d2 = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate()).getTime();
  return Math.floor((d1 - d2) / (24 * 60 * 60 * 1000));
}

// Calculate event positions for multi-day spanning
interface PositionedEvent {
  event: CalendarEvent;
  startCol: number;
  endCol: number;
  row: number;
  isStart: boolean;
  isEnd: boolean;
}

function calculateEventPositions(
  events: CalendarEvent[],
  weekStart: Date,
  _weekEnd: Date
): PositionedEvent[][] {
  const rows: PositionedEvent[][] = [];
  
  // Sort events by start date, then by duration (longer first)
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = new Date(a.startTime);
    const bStart = new Date(b.startTime);
    if (aStart.getTime() !== bStart.getTime()) {
      return aStart.getTime() - bStart.getTime();
    }
    const aDuration = new Date(a.endTime).getTime() - aStart.getTime();
    const bDuration = new Date(b.endTime).getTime() - bStart.getTime();
    return bDuration - aDuration;
  });

  for (const event of sortedEvents) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Get day indices
    let startCol = getDayIndex(eventStart, weekStart);
    let endCol = getDayIndex(eventEnd, weekStart);
    
    // Skip if event is completely outside this week
    if (startCol > 6 || endCol < 0) continue;
    
    // Clamp to week bounds
    const originalStartCol = startCol;
    const originalEndCol = endCol;
    startCol = Math.max(0, startCol);
    endCol = Math.min(6, endCol);
    
    const isStart = originalStartCol >= 0;
    const isEnd = originalEndCol <= 6;

    // Find a row where this event fits
    let rowIndex = 0;
    let placed = false;
    
    while (!placed) {
      if (!rows[rowIndex]) rows[rowIndex] = [];
      
      const currentRow = rows[rowIndex]!;
      const hasConflict = currentRow.some(
        pe => !(endCol < pe.startCol || startCol > pe.endCol)
      );
      
      if (!hasConflict) {
        currentRow.push({
          event,
          startCol,
          endCol,
          row: rowIndex,
          isStart,
          isEnd,
        });
        placed = true;
      } else {
        rowIndex++;
      }
    }
  }
  
  return rows;
}

export default function CalendarPage() {
  const { t } = useI18n();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showMoreModal, setShowMoreModal] = useState<{ date: string; events: CalendarEvent[] } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    hasIntegration: boolean;
    provider?: string;
    lastSyncAt?: string;
  } | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: formatDate(today.getFullYear(), today.getMonth(), today.getDate()),
    endDate: formatDate(today.getFullYear(), today.getMonth(), today.getDate()),
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

  const lastFetchKey = useRef<string>('');

  // Fetch sync status
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const res = await fetch('/api/calendar/sync/status');
        if (res.ok) {
          const data = await res.json();
          setSyncStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      }
    };
    fetchSyncStatus();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' });
      if (res.ok) {
        lastFetchKey.current = '';
        const fetchKey = `${currentYear}-${currentMonth}-${currentDay}-${viewMode}`;
        lastFetchKey.current = fetchKey;
        
        let startDate: string, endDate: string;
        if (viewMode === 'month') {
          startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
          endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${daysInMonth}`;
        } else {
          startDate = formatDate(currentYear, currentMonth, currentDay);
          endDate = startDate;
        }
        
        const eventsRes = await fetch(`/api/calendar?start=${startDate}&end=${endDate}`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.events || []);
        }
        
        setSyncStatus(prev => prev ? { ...prev, lastSyncAt: new Date().toISOString() } : null);
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const fetchKey = `${currentYear}-${currentMonth}-${currentDay}-${viewMode}`;
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
    return events.filter((e) => {
      const eventStart = e.startTime.slice(0, 10);
      const eventEnd = e.endTime.slice(0, 10);
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
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
    if (!newEvent.title.trim() || !newEvent.startDate) return;

    try {
      const startTime = newEvent.allDay 
        ? `${newEvent.startDate}T00:00:00` 
        : `${newEvent.startDate}T${newEvent.startTime}:00`;
      const endTime = newEvent.allDay 
        ? `${newEvent.endDate}T23:59:59` 
        : `${newEvent.endDate}T${newEvent.endTime}:00`;

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
        const todayDate = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
        setNewEvent({
          title: '',
          description: '',
          startDate: todayDate,
          endDate: todayDate,
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

  // Build calendar grid with weeks
  const calendarWeeks = useMemo(() => {
    const weeks: { date: Date | null; dateStr: string; day: number | null }[][] = [];
    let currentWeek: { date: Date | null; dateStr: string; day: number | null }[] = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: null, dateStr: '', day: null });
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = formatDate(currentYear, currentMonth, day);
      currentWeek.push({ date, dateStr, day });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill remaining days of last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({ date: null, dateStr: '', day: null });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentYear, currentMonth, daysInMonth, firstDay]);

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

  const handleEventHover = (event: CalendarEvent, e: React.MouseEvent) => {
    setHoveredEvent(event);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const MAX_VISIBLE_EVENTS = 3;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.calendar.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-6xl">
        {/* Sync Status */}
        {syncStatus?.hasIntegration && (
          <GlassCard>
            <GlassCardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {syncStatus.provider === 'google' ? (
                    <Cloud className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                  ) : (
                    <CloudOff className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {syncStatus.provider === 'google' ? 'Google Calendar' : 'Apple Calendar'} Sync
                    </p>
                    {syncStatus.lastSyncAt && (
                      <p className="text-xs text-gray-500">
                        Last synced: {new Date(syncStatus.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleSync} disabled={isSyncing} className="rounded-xl">
                  {isSyncing ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Syncing...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-1" />Sync</>
                  )}
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

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
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1',
                viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
              <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="w-10 h-10 rounded-xl hover:bg-white/50">
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </Button>
              <div className="text-center flex-1">
                <h2 className="text-lg font-bold text-gray-900">{getNavigationTitle()}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="w-10 h-10 rounded-xl hover:bg-white/50">
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl">
                {t.calendar.today}
              </Button>
              <Button 
                size="sm" 
                className="rounded-xl bg-blue-500 hover:bg-blue-600"
                onClick={() => {
                  const dateToUse = selectedDate || todayStr;
                  setNewEvent(prev => ({ ...prev, startDate: dateToUse, endDate: dateToUse }));
                  setShowAddModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
              </div>
            ) : viewMode === 'month' ? (
              /* Google Calendar Style Month View */
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Week day headers */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {t.common.weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2 border-r border-gray-200 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar weeks */}
                {calendarWeeks.map((week, weekIndex) => {
                  // Get events for this week
                  const weekStart = week.find(d => d.date)?.date;
                  const weekEnd = [...week].reverse().find(d => d.date)?.date;
                  
                  if (!weekStart || !weekEnd) {
                    return (
                      <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
                        {week.map((_, dayIndex) => (
                          <div key={dayIndex} className="min-h-[100px] md:min-h-[120px] border-r border-gray-200 last:border-r-0 bg-gray-50/50" />
                        ))}
                      </div>
                    );
                  }

                  // Get all events that span this week
                  const weekEvents = events.filter(e => {
                    const eventStart = e.startTime.slice(0, 10);
                    const eventEnd = e.endTime.slice(0, 10);
                    const weekStartStr = formatDate(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
                    const weekEndStr = formatDate(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
                    return eventEnd >= weekStartStr && eventStart <= weekEndStr;
                  });

                  // Calculate positioned events for this week
                  const positionedRows = calculateEventPositions(weekEvents, weekStart, new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000 - 1));

                  return (
                    <div key={weekIndex} className="border-b border-gray-200 last:border-b-0">
                      {/* Day numbers row */}
                      <div className="grid grid-cols-7">
                        {week.map((cell, dayIndex) => {
                          const isToday = cell.dateStr === todayStr;
                          const isSelected = cell.dateStr === selectedDate;
                          
                          return (
                            <div
                              key={dayIndex}
                              onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
                              className={cn(
                                'border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors',
                                cell.day === null && 'bg-gray-50/50',
                                isSelected && 'bg-blue-50'
                              )}
                            >
                              <div className="p-1 md:p-2">
                                {cell.day !== null && (
                                  <span className={cn(
                                    'inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm font-medium rounded-full',
                                    isToday && 'bg-blue-500 text-white',
                                    !isToday && 'text-gray-700 hover:bg-gray-100'
                                  )}>
                                    {cell.day}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Event bars area */}
                      <div className="grid grid-cols-7 min-h-[60px] md:min-h-[80px]">
                        {week.map((cell, dayIndex) => {
                          const dayEvents = cell.dateStr ? getEventsForDate(cell.dateStr) : [];
                          const hiddenCount = dayEvents.length - MAX_VISIBLE_EVENTS;
                          
                          // Find events that START on this day for rendering
                          const eventsStartingHere = positionedRows.flatMap(row => 
                            row.filter(pe => pe.startCol === dayIndex)
                          );

                          return (
                            <div
                              key={dayIndex}
                              className={cn(
                                'border-r border-gray-200 last:border-r-0 relative px-0.5 pb-1',
                                cell.day === null && 'bg-gray-50/50'
                              )}
                            >
                              {/* Render event bars that start on this day */}
                              {eventsStartingHere.slice(0, MAX_VISIBLE_EVENTS).map((pe) => {
                                const colors = getColors(pe.event.color);
                                const span = pe.endCol - pe.startCol + 1;
                                
                                return (
                                  <div
                                    key={pe.event.id}
                                    className={cn(
                                      'text-xs px-1.5 py-0.5 mb-0.5 truncate cursor-pointer transition-all hover:opacity-80',
                                      colors.bg,
                                      colors.text,
                                      pe.isStart ? 'rounded-l-md' : '',
                                      pe.isEnd ? 'rounded-r-md' : '',
                                      !pe.isStart && !pe.isEnd && 'rounded-none'
                                    )}
                                    style={{
                                      width: `calc(${span * 100}% + ${(span - 1) * 1}px)`,
                                      marginTop: `${pe.row * 22}px`,
                                      position: 'relative',
                                      zIndex: 10 - pe.row,
                                    }}
                                    onMouseEnter={(e) => handleEventHover(pe.event, e)}
                                    onMouseLeave={() => setHoveredEvent(null)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDate(pe.event.startTime.slice(0, 10));
                                    }}
                                  >
                                    {pe.isStart ? pe.event.title : ''}
                                  </div>
                                );
                              })}
                              
                              {/* +more indicator */}
                              {hiddenCount > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (cell.dateStr) {
                                      setShowMoreModal({ date: cell.dateStr, events: dayEvents });
                                    }
                                  }}
                                  className="text-xs text-blue-500 hover:text-blue-600 font-medium mt-1 px-1"
                                  style={{ marginTop: `${Math.min(eventsStartingHere.length, MAX_VISIBLE_EVENTS) * 22 + 4}px` }}
                                >
                                  +{hiddenCount} more
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                              {hourEvents.map((event) => {
                                const colors = getColors(event.color);
                                return (
                                  <div key={event.id} className={cn('text-xs p-1 rounded', colors.bg, colors.text, 'truncate')}>
                                    {event.title}
                                  </div>
                                );
                              })}
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
                          setNewEvent(prev => ({ 
                            ...prev, 
                            startDate: dateStr,
                            endDate: dateStr,
                            startTime: `${hour.toString().padStart(2, '0')}:00` 
                          }));
                          setShowAddModal(true);
                        }}
                        className="flex-1 min-h-[50px] hover:bg-blue-50 cursor-pointer rounded p-1"
                      >
                        {hourEvents.map((event) => {
                          const colors = getColors(event.color);
                          return (
                            <div key={event.id} className={cn('p-2 rounded-lg mb-1', colors.bg, colors.text)}>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-xs opacity-75">
                                {event.startTime.slice(11, 16)} - {event.endTime.slice(11, 16)}
                              </p>
                            </div>
                          );
                        })}
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
                  events.map((event) => {
                    const colors = getColors(event.color);
                    return (
                      <div key={event.id} className={cn('flex items-center gap-4 p-4 rounded-xl transition-colors group', colors.bg)}>
                        <div className={cn('w-1.5 h-12 rounded-full', colors.bg.replace('100', '500'))} />
                        <div className="flex-1">
                          <p className={cn('font-medium', colors.text)}>{event.title}</p>
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
                    );
                  })
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Selected Date Events Panel */}
        {viewMode === 'month' && selectedDate && (
          <GlassCard>
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>
                {t.calendar.eventsOn} {selectedDate}
              </GlassCardTitle>
              <Button 
                size="sm" 
                className="rounded-xl bg-blue-500 hover:bg-blue-600"
                onClick={() => {
                  setNewEvent(prev => ({ ...prev, startDate: selectedDate, endDate: selectedDate }));
                  setShowAddModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t.calendar.add}
              </Button>
            </GlassCardHeader>
            <GlassCardContent>
              {selectedEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedEvents.map((event) => {
                    const colors = getColors(event.color);
                    return (
                      <div key={event.id} className={cn('flex items-center gap-3 p-3 rounded-xl transition-colors group', colors.bg)}>
                        <div className="flex-1">
                          <p className={cn('font-medium', colors.text)}>{event.title}</p>
                          {!event.allDay && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">{t.calendar.noEvents}</div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}
      </div>

      {/* Event Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs pointer-events-none"
          style={{
            left: Math.min(tooltipPos.x + 10, window.innerWidth - 250),
            top: tooltipPos.y + 10,
          }}
        >
          <p className="font-medium text-gray-900">{hoveredEvent.title}</p>
          {hoveredEvent.description && (
            <p className="text-sm text-gray-500 mt-1">{hoveredEvent.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {hoveredEvent.allDay ? 'All day' : `${hoveredEvent.startTime.slice(11, 16)} - ${hoveredEvent.endTime.slice(11, 16)}`}
          </p>
        </div>
      )}

      {/* +More Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md">
            <GlassCardHeader className="flex flex-row items-center justify-between">
              <GlassCardTitle>Events on {showMoreModal.date}</GlassCardTitle>
              <button onClick={() => setShowMoreModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </GlassCardHeader>
            <GlassCardContent className="max-h-80 overflow-y-auto space-y-2">
              {showMoreModal.events.map((event) => {
                const colors = getColors(event.color);
                return (
                  <div key={event.id} className={cn('flex items-center gap-3 p-3 rounded-xl', colors.bg)}>
                    <div className="flex-1">
                      <p className={cn('font-medium', colors.text)}>{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {event.allDay ? 'All day' : `${event.startTime.slice(11, 16)} - ${event.endTime.slice(11, 16)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        handleDeleteEvent(event.id);
                        setShowMoreModal(prev => prev ? {
                          ...prev,
                          events: prev.events.filter(e => e.id !== event.id)
                        } : null);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md max-h-[90vh] overflow-y-auto">
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

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setNewEvent(prev => ({
                        ...prev,
                        startDate: newStartDate,
                        // If end date is before start date, update it
                        endDate: prev.endDate < newStartDate ? newStartDate : prev.endDate
                      }));
                    }}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={newEvent.endDate}
                    min={newEvent.startDate}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                    className="h-12 rounded-xl"
                  />
                </div>
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
                  className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600"
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

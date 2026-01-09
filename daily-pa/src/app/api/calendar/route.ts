import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isDevMode, getDevCalendarEvents, addDevCalendarEvent } from '@/lib/dev-store';

async function getUserId() {
  if (isDevMode()) {
    return 'dev-user-id';
  }
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// GET /api/calendar - 获取日历事件
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;

    // 开发模式：从内存存储获取
    if (isDevMode()) {
      const events = getDevCalendarEvents(start, end);
      return NextResponse.json({ events });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (start) {
      query = query.gte('start_time', `${start}T00:00:00`);
    }
    if (end) {
      query = query.lte('start_time', `${end}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.start_time,
      endTime: row.end_time,
      allDay: row.all_day,
      color: row.color || 'from-blue-500 to-blue-600',
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in GET /api/calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/calendar - 创建日历事件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // 开发模式：存入内存存储
    if (isDevMode()) {
      const event = addDevCalendarEvent({
        title: body.title,
        description: body.description || null,
        startTime: body.startTime,
        endTime: body.endTime,
        allDay: body.allDay || false,
        color: body.color || 'from-blue-500 to-blue-600',
      });
      return NextResponse.json(event, { status: 201 });
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    let colorValue = body.color || 'from-blue-500 to-blue-600';
    // Keep gradient format or hex color

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        title: body.title,
        description: body.description || null,
        start_time: body.startTime,
        end_time: body.endTime,
        all_day: body.allDay || false,
        color: colorValue,
        source: 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      allDay: data.all_day,
      color: data.color,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

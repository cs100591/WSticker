import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncCalendarEvents, getUserAuthProvider, type CalendarProvider } from '@/lib/calendar-sync';

// POST /api/calendar/sync - Trigger calendar sync
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's auth provider
    const authProvider = await getUserAuthProvider(user.id);
    
    if (!authProvider) {
      return NextResponse.json({ error: 'Could not determine auth provider' }, { status: 400 });
    }

    // Map auth provider to calendar provider
    let calendarProvider: CalendarProvider | null = null;
    
    if (authProvider === 'google') {
      calendarProvider = 'google';
    } else if (authProvider === 'apple') {
      calendarProvider = 'apple';
    }

    if (!calendarProvider) {
      return NextResponse.json({ 
        error: 'Calendar sync not available for this auth provider',
        provider: authProvider 
      }, { status: 400 });
    }

    // Trigger sync
    const result = await syncCalendarEvents(user.id, calendarProvider);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Sync failed' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider: calendarProvider,
      syncedCount: result.syncedCount,
      message: `Successfully synced ${result.syncedCount} events from ${calendarProvider} Calendar`
    });
  } catch (error) {
    console.error('Error in calendar sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/calendar/sync/status - Get sync status
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's auth provider
    const authProvider = await getUserAuthProvider(user.id);
    
    // Check if calendar integration exists
    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      authProvider,
      hasIntegration: !!integration,
      integration: integration ? {
        provider: integration.provider,
        syncEnabled: integration.sync_enabled,
        lastSyncAt: integration.last_sync_at,
      } : null,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

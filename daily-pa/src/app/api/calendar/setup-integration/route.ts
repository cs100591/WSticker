import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/calendar/setup-integration - Setup calendar integration after OAuth login
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's OAuth provider and tokens
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Check user's auth provider
    const provider = session.user.app_metadata?.provider || 
                    session.user.identities?.[0]?.provider;

    if (!provider || (provider !== 'google' && provider !== 'apple')) {
      return NextResponse.json({ 
        error: 'Calendar sync only available for Google and Apple login',
        provider 
      }, { status: 400 });
    }

    // For Google, we can use the provider_token from the session
    const providerToken = session.provider_token;
    const providerRefreshToken = session.provider_refresh_token;

    if (!providerToken) {
      return NextResponse.json({ 
        error: 'No provider token available. Please re-login to grant calendar access.' 
      }, { status: 400 });
    }

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('calendar_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (existing) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from('calendar_integrations')
        .update({
          access_token: providerToken,
          refresh_token: providerRefreshToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
          sync_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating integration:', updateError);
        return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Calendar integration updated',
        provider,
      });
    }

    // Create new integration
    const { error: insertError } = await supabase
      .from('calendar_integrations')
      .insert({
        user_id: user.id,
        provider,
        access_token: providerToken,
        refresh_token: providerRefreshToken,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        sync_enabled: true,
      });

    if (insertError) {
      console.error('Error creating integration:', insertError);
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar integration created',
      provider,
    });
  } catch (error) {
    console.error('Error in setup-integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

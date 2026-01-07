import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user agent and other info
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    
    // Parse user agent to get device info
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' : 'Unknown';

    // Mock devices data (in production, you'd store this in database)
    const devices = [
      {
        id: '1',
        name: isMobile ? 'iPhone' : isTablet ? 'iPad' : 'Desktop',
        type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        browser: browser,
        location: 'Current Location',
        lastActive: 'Just now',
        isCurrent: true,
      },
      // Add more mock devices if needed
    ];

    return NextResponse.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

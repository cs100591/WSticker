import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // After successful OAuth login, try to set up calendar integration
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.provider_token && session?.user?.app_metadata?.provider === 'google') {
          // Setup calendar integration for Google users
          await fetch(`${origin}/api/calendar/setup-integration`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
        }
      } catch (integrationError) {
        // Don't fail the login if calendar setup fails
        console.error('Calendar integration setup failed:', integrationError);
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 认证失败，重定向到登录页
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

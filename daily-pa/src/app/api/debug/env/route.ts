import { NextResponse } from 'next/server';

export async function GET() {
  // 只在开发环境或特定条件下显示环境变量信息
  const envInfo = {
    isDevSkipAuth: process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true',
    hasDevSkipAuthVar: !!process.env.NEXT_PUBLIC_DEV_SKIP_AUTH,
    devSkipAuthValue: process.env.NEXT_PUBLIC_DEV_SKIP_AUTH || 'undefined',
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'undefined',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envInfo);
}

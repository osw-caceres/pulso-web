import { createClient } from '@/src/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to complete profile after email confirmation
  return NextResponse.redirect(new URL('/register/complete-profile', requestUrl.origin));
}
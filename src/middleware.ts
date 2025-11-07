import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Allow access to complete-profile for authenticated users
  const isCompleteProfilePath = request.nextUrl.pathname.startsWith('/register/complete-profile');
  const isConfirmEmailPath = request.nextUrl.pathname.startsWith('/confirm-email');
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');
  
  // Allow auth callback without checking authentication
  if (isAuthCallback) {
    return supabaseResponse;
  }

  // Allow confirm-email page for everyone
  if (isConfirmEmailPath) {
    return supabaseResponse;
  }
  
  // Protected routes - redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access login/register (but not complete-profile), redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    // Check if user has completed their profile
    const { data: profile } = await supabase
      .from('user_info')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // No profile exists, redirect to complete-profile
      const url = request.nextUrl.clone()
      url.pathname = '/register/complete-profile'
      return NextResponse.redirect(url)
    }

    // Profile exists, redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // If authenticated user tries to access dashboard without completing profile
  if (user && !isCompleteProfilePath && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register')) {
    const { data: profile } = await supabase
      .from('user_info')
      .select('is_complete')
      .eq('id', user.id)
      .single();

    if (!profile?.is_complete) {
      // No profile, redirect to complete-profile
      const url = request.nextUrl.clone()
      url.pathname = '/register/complete-profile'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
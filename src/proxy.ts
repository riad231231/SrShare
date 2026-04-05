import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Optionnel: Ne pas protéger si on est en développement local sans env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
            secure: false
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
            secure: false
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
            secure: false
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
            secure: false
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protection des routes /admin et / (Home)
  const isProtectedPath = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/admin');
  
  if (isProtectedPath) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ['/', '/admin/:path*'],
};

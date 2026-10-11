import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/cuenta/citas';
  const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/cuenta/citas';
  const target = new URL(safeNext, url.origin);
  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && publishableKey) {
      const supabase = createServerClient(supabaseUrl, publishableKey, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: items => items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      });
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(target);
    }
  }
  target.pathname = '/login';
  target.searchParams.set('error', 'verification');
  return NextResponse.redirect(target);
}

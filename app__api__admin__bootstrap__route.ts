import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/data';

export async function POST() {
  const expectedEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  if (!isSupabaseConfigured() || !expectedEmail) return NextResponse.json({ promoted: false });
  try {
    const userClient = await createClient();
    const { data, error } = await userClient.auth.getUser();
    const user = data.user;
    if (error || !user || !user.email_confirmed_at || user.email?.toLowerCase() !== expectedEmail) {
      return NextResponse.json({ promoted: false });
    }
    const admin = createAdminClient();
    const { data: promoted, error: promoteError } = await admin.rpc('bootstrap_initial_admin', {
      p_user_id: user.id,
      p_expected_email: expectedEmail,
    });
    if (promoteError) {
      console.error('No se pudo completar el alta inicial de administrador.', promoteError);
      return NextResponse.json({ promoted: false, error: 'bootstrap_not_available' }, { status: 503 });
    }
    return NextResponse.json({ promoted: Boolean(promoted) });
  } catch (error) {
    console.error('No se pudo verificar el alta inicial de administrador.', error);
    return NextResponse.json({ promoted: false, error: 'bootstrap_not_available' }, { status: 503 });
  }
}

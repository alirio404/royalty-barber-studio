import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'La gestión de citas no está configurada.' }, { status: 503 });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Identificador de cita no válido.' }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return NextResponse.json({ error: 'Inicia sesión para gestionar tus citas.' }, { status: 401 });
    const { data, error } = await supabase.from('appointments').update({ status: 'CANCELADA' }).eq('id', id).select('id,status').single();
    if (error || !data) {
      if (error?.code === '42501') return NextResponse.json({ error: error.message }, { status: 422 });
      if (error?.code === 'PGRST116') return NextResponse.json({ error: 'No se encontró la cita o no tienes permiso para cancelarla.' }, { status: 404 });
      return NextResponse.json({ error: 'No se pudo cancelar. Comprueba que sea una cita futura y cancelable.' }, { status: 409 });
    }
    return NextResponse.json({ appointment: data });
  } catch (error) {
    console.error('Error al cancelar cita.', error);
    return NextResponse.json({ error: 'La cancelación no está disponible temporalmente.' }, { status: 503 });
  }
}

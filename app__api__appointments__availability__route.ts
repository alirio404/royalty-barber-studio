import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/data';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Reservas todavía no están configuradas.' }, { status: 503 });
  const serviceId = request.nextUrl.searchParams.get('serviceId') ?? '';
  const barberId = request.nextUrl.searchParams.get('barberId') ?? '';
  const date = request.nextUrl.searchParams.get('date') ?? '';
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
  const validDate = Boolean(parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date);
  if (!UUID.test(serviceId) || !UUID.test(barberId) || !validDate) {
    return NextResponse.json({ error: 'Servicio, barbero o fecha no válidos.' }, { status: 400 });
  }
  try {
    const userClient = await createClient();
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return NextResponse.json({ error: 'Inicia sesión para consultar la disponibilidad.' }, { status: 401 });

    // Service-role is server-only and returns time slots only; no customer/appointment records are exposed.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('get_available_slots', {
      p_service_id: serviceId,
      p_barber_id: barberId,
      p_date: date,
    });
    if (error) {
      console.error('No se pudo calcular disponibilidad.', error);
      return NextResponse.json({ error: 'No se pudo calcular la disponibilidad. Revisa la configuración del negocio.' }, { status: 503 });
    }
    return NextResponse.json({ slots: (data ?? []).map((row: { starts_at: string }) => row.starts_at) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Servicio de disponibilidad no preparado.', error);
    return NextResponse.json({ error: 'El sistema de reservas no está listo. No se ha creado ninguna cita.' }, { status: 503 });
  }
}

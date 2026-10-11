import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Reservas todavía no están configuradas.' }, { status: 503 });
  let body: { serviceId?: unknown; barberId?: unknown; startsAt?: unknown; customerNote?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'La solicitud no tiene un formato válido.' }, { status: 400 }); }

  const serviceId = typeof body.serviceId === 'string' ? body.serviceId : '';
  const barberId = typeof body.barberId === 'string' ? body.barberId : '';
  const startsAt = typeof body.startsAt === 'string' ? body.startsAt : '';
  const customerNote = typeof body.customerNote === 'string' ? body.customerNote.trim() : '';
  const startDate = new Date(startsAt);
  if (!UUID.test(serviceId) || !UUID.test(barberId) || !startsAt || Number.isNaN(startDate.getTime()) || startDate.toISOString() !== startsAt) {
    return NextResponse.json({ error: 'Servicio, barbero u hora no válidos. Selecciona una hora de la lista.' }, { status: 400 });
  }
  if (customerNote.length > 1000) return NextResponse.json({ error: 'La nota no puede superar 1000 caracteres.' }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: 'Inicia sesión antes de pedir una cita.' }, { status: 401 });

    const { data: service, error: serviceError } = await supabase.from('services')
      .select('duration_minutes,currency,price').eq('id', serviceId).eq('is_active', true).eq('is_published', true).single();
    if (serviceError || !service) return NextResponse.json({ error: 'Este servicio ya no está disponible.' }, { status: 409 });

    const endAt = new Date(startDate.getTime() + Number(service.duration_minutes) * 60_000).toISOString();
    const { data: appointment, error } = await supabase.from('appointments').insert({
      customer_id: user.id,
      barber_id: barberId,
      service_id: serviceId,
      starts_at: startsAt,
      ends_at: endAt,
      quoted_price: Number(service.price),
      currency: service.currency,
      status: 'SOLICITADA',
      customer_note: customerNote || null,
    }).select('id,public_code,status,starts_at,ends_at,quoted_price,currency').single();

    if (error) {
      if (error.code === '23P01' || error.code === '23505') {
        return NextResponse.json({ error: 'Ese horario acaba de ocuparse. Actualiza la disponibilidad y elige otro.' }, { status: 409 });
      }
      if (error.code === 'P0001') {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
      console.error('No se pudo crear la cita.', error);
      return NextResponse.json({ error: 'No se pudo registrar la solicitud. No se ha confirmado ninguna cita.' }, { status: 503 });
    }
    return NextResponse.json({ appointment }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Servicio de creación de citas no preparado.', error);
    return NextResponse.json({ error: 'El sistema de reservas no está listo. No se ha creado ninguna cita.' }, { status: 503 });
  }
}

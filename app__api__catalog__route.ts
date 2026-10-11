import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'La base de datos todavía no está conectada.' }, { status: 503 });
  }
  try {
    const supabase = await createClient();
    const [servicesRes, barbersRes, linksRes, settingsRes] = await Promise.all([
      supabase.from('services').select('id,slug,name,category,description,duration_minutes,price,currency').eq('is_active', true).eq('is_published', true).order('sort_order'),
      supabase.from('barbers').select('id,slug,display_name').eq('is_active', true).eq('is_published', true).order('sort_order'),
      supabase.from('barber_services').select('barber_id,service_id'),
      supabase.from('business_settings').select('booking_horizon_days,timezone').eq('singleton', true).eq('is_published', true).maybeSingle(),
    ]);
    const failed = servicesRes.error || barbersRes.error || linksRes.error || settingsRes.error;
    if (failed) {
      console.error('No se pudo preparar el catálogo de reservas.', failed);
      return NextResponse.json({ error: 'No se pudo cargar el catálogo de reservas.' }, { status: 503 });
    }
    const services = servicesRes.data ?? [];
    const barbers = barbersRes.data ?? [];
    const links = linksRes.data ?? [];
    const assignedServiceIds = new Set(links.map(row => row.service_id));
    const assignedBarberIds = new Set(links.map(row => row.barber_id));
    return NextResponse.json({ services: services.filter(row => assignedServiceIds.has(row.id)), barbers: barbers.filter(row => assignedBarberIds.has(row.id)), barberServices: links, settings: settingsRes.data ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error de catálogo.', error);
    return NextResponse.json({ error: 'El catálogo no está disponible temporalmente.' }, { status: 503 });
  }
}

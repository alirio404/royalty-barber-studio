import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookingWizard } from '@/components/booking-wizard';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';

export const metadata: Metadata = { title: 'Reservar turno', robots: { index: false, follow: false } };
type Search = Promise<{ servicio?: string; barbero?: string }>;

function BookingPaused() {
  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">ROYALTY BOOKING SYSTEM</p><h1>AGENDA TU <span>TURNO.</span></h1><p>Las reservas online están pausadas hasta que la barbería confirme sus datos operativos y publique horarios, servicios y precios. No mostraremos huecos simulados ni aceptaremos citas de prueba.</p><Link className="button button-red" href="/contacto">Consultar los canales oficiales ↗</Link></section></div>;
}

export default async function BookingPage({ searchParams }: { searchParams: Search }) {
  const { servicio = '', barbero = '' } = await searchParams;
  if (!isSupabaseConfigured()) return <BookingPaused />;

  const supabase = await createClient();
  const [userResult, settingsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('business_settings').select('is_published').eq('singleton', true).eq('is_published', true).maybeSingle(),
  ]);
  if (settingsResult.error) {
    return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">ROYALTY BOOKING SYSTEM</p><h1>RESERVAS <span>NO DISPONIBLES.</span></h1><p>No pudimos verificar la configuración de reservas. No se ha creado ninguna cita.</p><Link className="button button-outline" href="/contacto">Consultar con la barbería ↗</Link></section></div>;
  }
  if (!settingsResult.data?.is_published) return <BookingPaused />;

  const user = userResult.data.user;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/reservar${servicio || barbero ? `?${new URLSearchParams({ ...(servicio ? { servicio } : {}), ...(barbero ? { barbero } : {}) })}` : ''}`)}`);

  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">ROYALTY BOOKING SYSTEM / 01</p><h1>RESERVA TU <span>MOMENTO.</span></h1><p>Selecciona un servicio, el barbero y una hora disponible. El servidor verificará el horario antes de registrar la solicitud.</p></section><div className="booking-layout"><aside className="booking-aside"><p className="eyebrow">ANTES DE CONFIRMAR</p><h2>Una cita real.<br />Un proceso claro.</h2><p>La disponibilidad se consulta en la base de datos y el horario vuelve a comprobarse al guardar.</p><p>La solicitud queda como <strong>SOLICITADA</strong> hasta que la barbería la apruebe. Recibirás un código para hacer seguimiento.</p><p><Link href="/cuenta/citas" className="inline-link">Consultar mis solicitudes ↗</Link></p></aside><BookingWizard initialServiceId={servicio} initialBarberId={barbero} /></div></div>;
}

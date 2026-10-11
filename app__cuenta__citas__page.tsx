import { formatMoney } from '@/lib/format';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/data';
import { CancelAppointmentButton } from '@/components/cancel-appointment-button';
export const metadata: Metadata = { title: 'Mis citas', robots: { index: false, follow: false } };

type AppointmentRow = {
  id: string; public_code: string; starts_at: string; ends_at: string; quoted_price: number | string;
  currency: string; status: string; customer_note: string | null;
  services: { name: string } | null; barbers: { display_name: string } | null;
};
const statusLabel: Record<string, string> = {
  SOLICITADA: 'PENDIENTE DE CONFIRMACIÓN', CONFIRMADA: 'CONFIRMADA', EN_PROCESO: 'EN PROCESO',
  COMPLETADA: 'COMPLETADA', CANCELADA: 'CANCELADA', NO_ASISTIO: 'NO ASISTIÓ',
};

export default async function MyAppointmentsPage() {
  if (!isSupabaseConfigured()) return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">ROYALTY ACCOUNT</p><h1>MIS <span>CITAS.</span></h1><p>La cuenta no estará disponible hasta que se configure la autenticación real.</p><Link href="/login" className="button button-red">Iniciar sesión ↗</Link></section></div>;
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) redirect('/login?next=%2Fcuenta%2Fcitas');
  let items: AppointmentRow[] = [];
  let loadError = '';
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from('appointments')
      .select('id,public_code,starts_at,ends_at,quoted_price,currency,status,customer_note,services(name),barbers(display_name)')
      .eq('customer_id', user.id).order('starts_at', { ascending: false });
    if (error) throw error;
    items = (data ?? []) as unknown as AppointmentRow[];
  } catch (error) {
    console.error('No se pudieron cargar las citas de la cuenta.', error);
    loadError = 'No se pudo consultar tu historial. Comprueba la configuración del sistema e inténtalo de nuevo.';
  }

  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">ROYALTY ACCOUNT / APPOINTMENTS</p><h1>MIS <span>CITAS.</span></h1><p>Sesión iniciada como {user.email}. Aquí aparecen tus solicitudes y citas registradas.</p><Link href="/reservar" className="button button-red">Nueva solicitud ↗</Link></section>
    {loadError ? <div className="notice notice-error">{loadError}</div> : items.length ? <div className="appointment-list">{items.map(item => {
      const start = new Date(item.starts_at);
      const canCancel = ['SOLICITADA', 'CONFIRMADA'].includes(item.status) && start.getTime() > Date.now();
      return <article className="appointment-row" key={item.id}><div><span className="appointment-status">{statusLabel[item.status] ?? item.status}</span><h2>{item.services?.name ?? 'Servicio registrado'} · {item.public_code}</h2><p>{new Intl.DateTimeFormat('es-VE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Caracas' }).format(start)}</p><p>Barbero: {item.barbers?.display_name ?? 'Equipo Royalty'} · Importe acordado: {formatMoney(item.quoted_price, item.currency, 'es-VE')}</p>{item.customer_note && <p>Tu nota: {item.customer_note}</p>}</div>{canCancel && <CancelAppointmentButton id={item.id} />}</article>;
    })}</div> : <div className="empty-state"><h3>Todavía no tienes citas.</h3><p>Cuando envíes una solicitud, su código y estado aparecerán aquí.</p><Link href="/reservar" className="button button-red">Solicitar una cita ↗</Link></div>}
  </div>;
}

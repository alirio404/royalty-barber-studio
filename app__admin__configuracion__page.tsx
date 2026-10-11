import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { saveBusinessSettings } from '@/app/admin/actions';
import { isSupabaseConfigured } from '@/lib/data';

export const metadata: Metadata = { title: 'Configuración del negocio' };
type Search = Promise<{ ok?: string; error?: string }>;
const errors: Record<string, string> = {
  datos: 'Revisa el nombre, la zona horaria, la moneda y los límites numéricos.',
  zona: 'La zona horaria no existe.',
  instagram: 'El Instagram debe ser una URL válida de instagram.com.',
  contacto: 'Antes de publicar, introduce los datos de contacto reales.',
  preparacion: 'Antes de publicar: cada servicio y barbero activo debe estar correctamente relacionado, tener horario abierto y usar la moneda principal del negocio.',
  guardar: 'No se pudo guardar la configuración.',
};

export default async function AdminSettingsPage({ searchParams }: { searchParams: Search }) {
  if (!isSupabaseConfigured()) return <div className="section-wrap admin-content"><div className="notice notice-error">Este panel requiere una base de datos real conectada. No hay acciones simuladas habilitadas.</div></div>;
  const supabase = await createClient();
  const query = await searchParams;
  const [settingsRes, servicesRes, barbersRes, mappingsRes, schedulesRes] = await Promise.all([
    supabase.from('business_settings').select('*').eq('singleton', true).maybeSingle(),
    supabase.from('services').select('id,currency').eq('is_active', true).eq('is_published', true),
    supabase.from('barbers').select('id').eq('is_active', true).eq('is_published', true),
    supabase.from('barber_services').select('service_id,barber_id'),
    supabase.from('schedules').select('barber_id').eq('is_closed', false),
  ]);
  const item = settingsRes.data;
  const failed = settingsRes.error || servicesRes.error || barbersRes.error || mappingsRes.error || schedulesRes.error;
  const liveServices = servicesRes.data ?? [];
  const liveBarbers = barbersRes.data ?? [];
  const liveServiceIds = new Set(liveServices.map(row => row.id));
  const liveBarberIds = new Set(liveBarbers.map(row => row.id));
  const activeMappings = (mappingsRes.data ?? []).filter(row => liveServiceIds.has(row.service_id) && liveBarberIds.has(row.barber_id));
  const servicesWithBarber = new Set(activeMappings.map(row => row.service_id));
  const barbersWithService = new Set(activeMappings.map(row => row.barber_id));
  const barbersWithHours = new Set((schedulesRes.data ?? []).map(row => row.barber_id));
  const readyServicesCount = liveServices.filter(row => servicesWithBarber.has(row.id)).length;
  const readyBarbersCount = liveBarbers.filter(row => barbersWithService.has(row.id) && barbersWithHours.has(row.id)).length;
  const error = settingsRes.error;

  return <div className="section-wrap admin-content">
    <section className="page-hero"><p className="eyebrow">ADMIN / IDENTIDAD Y REGLAS</p><h1>PRIMERO, LOS <span>DATOS REALES.</span></h1><p>Publicar esta configuración habilita las reservas; los servicios, perfiles y fotos tienen controles de publicación propios. Antes de activar, comprobamos la coherencia entre servicios, equipo, moneda y horarios.</p></section>
    {query.ok && <div className="notice">Configuración guardada.</div>}
    {query.error && <div className="notice notice-error">{errors[query.error] ?? 'No se pudo guardar.'}</div>}
    {(failed || error) && <div className="notice notice-error">No se pudieron consultar todos los datos. No publiques hasta resolver el error de conexión.</div>}

    <div className="admin-preflight">
      <h2>Control previo a publicación</h2>
      <div><span>Servicios con barbero activo asignado</span><strong>{failed ? '—' : `${readyServicesCount}/${liveServices.length}`}</strong></div>
      <div><span>Barberos con servicio y horario abierto</span><strong>{failed ? '—' : `${readyBarbersCount}/${liveBarbers.length}`}</strong></div>
      <p>Los indicadores técnicos no sustituyen confirmar precios, dirección, teléfono, políticas, autorización de fotos y pruebas en móvil y escritorio.</p>
    </div>

    <section className="admin-section"><h2>Identidad y operación</h2><form action={saveBusinessSettings} className="admin-record-form"><div className="admin-form-grid">
      <div className="field"><label>Nombre comercial</label><input name="name" required maxLength={120} defaultValue={item?.name ?? 'Royalty Barber Studio'} /></div>
      <div className="field"><label>Teléfono confirmado</label><input name="phone" maxLength={40} defaultValue={item?.phone ?? ''} placeholder="Confirma el número oficial" /></div>
      <div className="field field-wide"><label>Dirección que verá el público</label><input name="address" maxLength={300} defaultValue={item?.address ?? ''} placeholder="Dirección confirmada de la barbería" /></div>
      <div className="field"><label>Instagram URL</label><input name="instagram_url" type="url" defaultValue={item?.instagram_url ?? 'https://instagram.com/royaltybarberstudio2026'} placeholder="https://instagram.com/…" /></div>
      <div className="field"><label>Zona horaria del negocio</label><input value="America/Caracas" readOnly /><input type="hidden" name="timezone" value="America/Caracas" /><small>Sanare, Venezuela (UTC−04:00). Se mantiene fija para que reservas y agenda usen la misma hora local.</small></div>
      <div className="field"><label>Moneda principal (ISO)</label><input name="currency" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" defaultValue={item?.currency?.trim() ?? ''} placeholder="USD" /><small>Las tarifas provisionales del documento no se consideran definitivas.</small></div>
      <div className="field"><label>Horizonte de reservas (días)</label><input name="booking_horizon_days" type="number" min="1" max="90" required defaultValue={item?.booking_horizon_days ?? 10} /></div>
      <div className="field"><label>Antelación mínima (minutos)</label><input name="booking_min_notice_minutes" type="number" min="0" max="10080" required defaultValue={item?.booking_min_notice_minutes ?? 60} /></div>
      <div className="field"><label>Margen mínimo para cancelar (minutos)</label><input name="cancellation_min_notice_minutes" type="number" min="0" max="10080" required defaultValue={item?.cancellation_min_notice_minutes ?? 120} /></div>
    </div><div className="admin-checks"><label><input type="checkbox" name="is_published" defaultChecked={item?.is_published ?? false} /> Publicar configuración y habilitar reservas online</label></div><p className="muted">Si la casilla está desactivada, las reservas quedan pausadas. Publica solo cuando los datos de contacto, horarios, barberos, servicios, precios y permisos estén revisados.</p><button className="button button-red" type="submit">Guardar configuración ↗</button></form></section>

    <section className="admin-section"><h2>Reglas de puesta en marcha</h2><ul className="admin-checklist"><li>Confirmar teléfono, dirección exacta y horarios.</li><li>Confirmar precio, moneda y duración de cada servicio.</li><li>Añadir la historia real y foto autorizada de Emmanuel Rose.</li><li>Subir únicamente fotografías auténticas con permiso para publicarlas.</li><li>Probar registro, acceso, solicitud de cita, cancelación y panel de administración.</li><li>Configurar correo de autenticación y las notificaciones operativas que se decidan.</li></ul></section>
  </div>;
}

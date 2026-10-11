import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { updateAppointmentStatus } from '@/app/admin/actions';
import { isSupabaseConfigured } from '@/lib/data';
export const metadata: Metadata = { title: 'Gestionar reservas' };
type Search = Promise<{ ok?: string; error?: string }>;
const statusLabels: Record<string,string> = { SOLICITADA:'Por aprobar', CONFIRMADA:'Confirmada', EN_PROCESO:'En curso', COMPLETADA:'Completada', CANCELADA:'Cancelada', NO_ASISTIO:'No asistió' };
const stateOptions: Record<string, [string,string][]> = { SOLICITADA: [['CONFIRMADA','Confirmar'],['CANCELADA','Cancelar']], CONFIRMADA: [['EN_PROCESO','Iniciar servicio'],['CANCELADA','Cancelar']], EN_PROCESO: [['COMPLETADA','Completar'],['NO_ASISTIO','No asistió']] };
function localDate(iso:string) { return new Intl.DateTimeFormat('es-VE',{timeZone:'America/Caracas',dateStyle:'medium',timeStyle:'short'}).format(new Date(iso)); }
export default async function AdminAppointmentsPage({searchParams}:{searchParams:Search}) {
  if (!isSupabaseConfigured()) return <div className="section-wrap admin-content"><div className="notice notice-error">Este panel requiere una base de datos real conectada. No hay acciones simuladas habilitadas.</div></div>;
 const supabase=await createClient(); const query=await searchParams;
 const [apptsRes,servicesRes,barbersRes,profilesRes]=await Promise.all([
  supabase.from('appointments').select('*').order('created_at',{ascending:false}).limit(150),
  supabase.from('services').select('id,name'), supabase.from('barbers').select('id,display_name'), supabase.from('profiles').select('id,full_name,phone')
 ]);
 const failed=apptsRes.error||servicesRes.error||barbersRes.error||profilesRes.error;
 const appts=apptsRes.data??[]; const services=servicesRes.data??[]; const barbers=barbersRes.data??[]; const profiles=profilesRes.data??[];
 const serviceName=(id:string)=>services.find(x=>x.id===id)?.name??'Servicio'; const barberName=(id:string)=>barbers.find(x=>x.id===id)?.display_name??'Barbero'; const customer=(id:string)=>profiles.find(x=>x.id===id);
 return <div className="section-wrap admin-content"><section className="page-hero"><p className="eyebrow">ADMIN / CITAS</p><h1>NINGÚN TURNO <span>SE PIERDE.</span></h1><p>Las solicitudes aparecen primero como pendientes. Cambiar un estado actualiza la cita persistida; no se simula una confirmación.</p></section>
 {query.ok&&<div className="notice">Estado actualizado.</div>}{query.error&&<div className="notice notice-error">{query.error==='transicion'?'Ese cambio de estado no está permitido para la situación actual de la cita.':'No se pudo cambiar el estado. Puede que la cita ya no esté disponible.'}</div>}{failed&&<div className="notice notice-error">No se pudieron cargar todas las reservas. Revisa la base de datos.</div>}
 <div className="admin-filter-note">Mostrando hasta 150 solicitudes más recientes por fecha de creación.</div>
 {appts.length? <div className="admin-appointments">{appts.map(a=>{const c=customer(a.customer_id);return <article className="admin-appointment" key={a.id}><div className="admin-appointment-head"><span className="appointment-code">{a.public_code}</span><span className={`status status-${String(a.status).toLowerCase()}`}>{statusLabels[a.status]??a.status}</span></div><h2>{serviceName(a.service_id)}</h2><p className="admin-appointment-time">{localDate(a.starts_at)} · {a.duration_minutes?`${a.duration_minutes} min`:Math.round((new Date(a.ends_at).getTime()-new Date(a.starts_at).getTime())/60000)+' min'} · {Number(a.quoted_price).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})} {a.currency}</p><dl><div><dt>Cliente</dt><dd>{c?.full_name||'Nombre no indicado'}</dd></div><div><dt>Contacto</dt><dd>{c?.phone||'Sin teléfono en el perfil'}</dd></div><div><dt>Barbero</dt><dd>{barberName(a.barber_id)}</dd></div><div><dt>Creada</dt><dd>{localDate(a.created_at)}</dd></div></dl>{a.customer_note&&<p className="admin-client-note"><strong>Nota del cliente:</strong> {a.customer_note}</p>}
 {['CANCELADA','COMPLETADA','NO_ASISTIO'].includes(a.status)?<p className="muted">Estado final; no se muestra un cambio rápido.</p>:<form action={updateAppointmentStatus} className="admin-status-form"><input type="hidden" name="id" value={a.id}/><label>Actualizar estado<select name="status" defaultValue={a.status==='SOLICITADA'?'CONFIRMADA':a.status==='CONFIRMADA'?'EN_PROCESO':'COMPLETADA'}>{(stateOptions[a.status]??[]).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="button button-red button-small" type="submit">Guardar estado</button></form>}</article>})}</div>:<div className="empty-state"><h3>Todavía no hay reservas.</h3><p>Las citas reales que envíen los clientes aparecerán aquí cuando la base de datos esté conectada y el negocio haya activado sus horarios.</p></div>}
 </div>;
}

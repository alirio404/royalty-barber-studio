import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { saveBarber } from '@/app/admin/actions';
import { isSupabaseConfigured } from '@/lib/data';
export const metadata: Metadata = { title: 'Administrar barberos' };
type Search = Promise<{ ok?: string; error?: string }>;
const errorText: Record<string, string> = { datos: 'Nombre o slug no válidos.', slug: 'Ese slug ya está en uso.', guardar: 'No se pudo guardar el perfil.', relacion: 'No se pudieron actualizar los servicios del barbero.' };

function BarberForm({ barber, services, assigned }: { barber?: any; services: any[]; assigned: string[] }) {
  return <form action={saveBarber} className="admin-record-form">
    {barber && <input type="hidden" name="id" value={barber.id} />}
    <div className="admin-form-grid"><div className="field"><label>Nombre público</label><input name="display_name" required maxLength={120} defaultValue={barber?.display_name ?? ''} placeholder="Nombre y apellido" /></div><div className="field"><label>Slug</label><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={barber?.slug ?? ''} placeholder="nombre-apellido" /></div><div className="field"><label>Especialidades (separadas por coma)</label><input name="specialties" maxLength={600} defaultValue={(barber?.specialties ?? []).join(', ')} placeholder="Fades, texturing, barba" /></div><div className="field"><label>Biografía</label><textarea name="biography" rows={3} maxLength={1600} defaultValue={barber?.biography ?? ''} placeholder="Solo información real y aprobada." /></div></div>
    <div className="field"><label>Servicios que puede realizar</label><div className="admin-check-grid">{services.map(service => <label key={service.id}><input type="checkbox" name="service_ids" value={service.id} defaultChecked={assigned.includes(service.id)} /> {service.name}{!service.is_active || !service.is_published ? ' (borrador/inactivo)' : ''}</label>)}</div></div>
    <div className="admin-checks"><label><input type="checkbox" name="is_active" defaultChecked={barber?.is_active ?? false} /> Activo para citas</label><label><input type="checkbox" name="is_published" defaultChecked={barber?.is_published ?? false} /> Publicar perfil</label></div>
    <button className="button button-red" type="submit">{barber ? 'Guardar perfil' : 'Crear perfil'} ↗</button>
  </form>;
}

export default async function AdminBarbersPage({ searchParams }: { searchParams: Search }) {
  if (!isSupabaseConfigured()) return <div className="section-wrap admin-content"><div className="notice notice-error">Este panel requiere una base de datos real conectada. No hay acciones simuladas habilitadas.</div></div>;
  const [supabase, query] = [await createClient(), await searchParams];
  const [barbersRes, servicesRes, relationsRes] = await Promise.all([
    supabase.from('barbers').select('*').order('sort_order').order('display_name'),
    supabase.from('services').select('id,name,is_active,is_published').order('sort_order'),
    supabase.from('barber_services').select('barber_id,service_id'),
  ]);
  const error = barbersRes.error || servicesRes.error || relationsRes.error;
  const barbers = barbersRes.data ?? []; const services = servicesRes.data ?? []; const relations = relationsRes.data ?? [];
  return <div className="section-wrap admin-content"><section className="page-hero"><p className="eyebrow">ADMIN / EQUIPO</p><h1>PERFILES CON <span>CARÁCTER.</span></h1><p>Activa solo a los barberos que trabajan realmente en el negocio y asígnales los servicios que pueden realizar.</p></section>
    {query.ok && <div className="notice">Cambios guardados.</div>}{query.error && <div className="notice notice-error">{errorText[query.error] ?? 'Ocurrió un error al guardar.'}</div>}{error && <div className="notice notice-error">No se pudieron cargar los perfiles del equipo.</div>}
    <section className="admin-section"><h2>Agregar barbero</h2><BarberForm services={services} assigned={[]} /></section>
    <section className="admin-section"><h2>Equipo existente <span className="muted-count">{barbers.length}</span></h2>{barbers.length ? barbers.map(barber => <details className="admin-details" key={barber.id}><summary><span>{barber.display_name}</span><small>{barber.is_published ? 'PUBLICADO' : 'BORRADOR'} · {barber.is_active ? 'ACTIVO' : 'INACTIVO'}</small></summary><BarberForm barber={barber} services={services} assigned={relations.filter(row => row.barber_id === barber.id).map(row => row.service_id)} /></details>) : <div className="empty-state"><h3>No hay perfiles.</h3><p>Crea el perfil con datos reales. Para Emmanuel Rose, la biografía y la fotografía quedan pendientes de recibir y aprobar.</p></div>}</section>
  </div>;
}

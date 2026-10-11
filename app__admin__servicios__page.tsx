import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { saveService } from '@/app/admin/actions';
import { isSupabaseConfigured } from '@/lib/data';
export const metadata: Metadata = { title: 'Administrar servicios' };
type Search = Promise<{ ok?: string; error?: string }>;
const errorText: Record<string, string> = { datos: 'Revisa el nombre y el slug. El slug solo admite minúsculas, números y guiones.', precio: 'Indica un precio válido y una moneda ISO de tres letras, por ejemplo USD.', categoria: 'La categoría no es válida.', moneda: 'La moneda del servicio debe coincidir con la moneda principal publicada del negocio.', slug: 'Ese slug ya está en uso.', guardar: 'No se pudo guardar. Revisa los datos e inténtalo de nuevo.' };

function ServiceForm({ service }: { service?: any }) {
  return <form action={saveService} className="admin-record-form">
    {service && <input type="hidden" name="id" value={service.id} />}
    <div className="admin-form-grid"><div className="field"><label>Nombre público</label><input name="name" required maxLength={120} defaultValue={service?.name ?? ''} placeholder="Corte Signature" /></div><div className="field"><label>Slug para URL</label><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={service?.slug ?? ''} placeholder="corte-signature" /></div><div className="field"><label>Categoría</label><select name="category" defaultValue={service?.category ?? 'CORTES'}><option value="CORTES">Cortes</option><option value="BARBA">Barba y afeitado</option><option value="RITUAL">Rituales</option></select></div><div className="field"><label>Duración (minutos)</label><input name="duration_minutes" type="number" min="5" max="360" step="5" required defaultValue={service?.duration_minutes ?? ''} /></div><div className="field"><label>Precio</label><input name="price" type="number" min="0" max="1000000" step="0.01" required defaultValue={service?.price ?? ''} /></div><div className="field"><label>Moneda (ISO 4217)</label><input name="currency" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" defaultValue={service?.currency?.trim() ?? ''} placeholder="USD" /></div><div className="field"><label>Orden de aparición</label><input name="sort_order" type="number" min="0" max="9999" defaultValue={service?.sort_order ?? 0} /></div><div className="field"><label>Descripción</label><textarea name="description" rows={3} maxLength={1200} defaultValue={service?.description ?? ''} /></div></div>
    <div className="admin-checks"><label><input type="checkbox" name="is_active" defaultChecked={service?.is_active ?? false} /> Activo para nuevas citas</label><label><input type="checkbox" name="is_published" defaultChecked={service?.is_published ?? false} /> Publicar en la web</label></div>
    <button className="button button-red" type="submit">{service ? 'Guardar cambios' : 'Crear servicio'} ↗</button>
  </form>;
}

export default async function AdminServicesPage({ searchParams }: { searchParams: Search }) {
  if (!isSupabaseConfigured()) return <div className="section-wrap admin-content"><div className="notice notice-error">Este panel requiere una base de datos real conectada. No hay acciones simuladas habilitadas.</div></div>;
  const [supabase, query] = [await createClient(), await searchParams];
  const { data, error } = await supabase.from('services').select('*').order('sort_order').order('name');
  return <div className="section-wrap admin-content"><section className="page-hero"><p className="eyebrow">ADMIN / CATÁLOGO</p><h1>GESTIONAR <span>SERVICIOS.</span></h1><p>Las tarifas del documento de planificación eran provisionales. Revisa precio, moneda, duración y publicación antes de activar las reservas.</p></section>
    {query.ok && <div className="notice">Cambios guardados.</div>}{query.error && <div className="notice notice-error">{errorText[query.error] ?? 'Ocurrió un error al guardar.'}</div>}{error && <div className="notice notice-error">No se pudo cargar el catálogo de administración.</div>}
    <section className="admin-section"><h2>Crear un servicio</h2><ServiceForm /></section>
    <section className="admin-section"><h2>Servicios existentes <span className="muted-count">{data?.length ?? 0}</span></h2>{data?.length ? data.map(service => <details className="admin-details" key={service.id}><summary><span>{service.name}</span><small>{service.category} · {service.duration_minutes} min · {service.price} {service.currency} · {service.is_published ? 'PUBLICADO' : 'BORRADOR'}</small></summary><ServiceForm service={service} /></details>) : <div className="empty-state"><h3>No hay servicios cargados.</h3><p>Crea cada servicio con los datos finales confirmados por la barbería. No se han cargado tarifas de ejemplo.</p></div>}</section>
  </div>;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';
export const metadata: Metadata = { title: 'Administración' };

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) return <div className="section-wrap admin-content"><div className="notice notice-error">Este panel requiere una base de datos real conectada. No hay acciones simuladas habilitadas.</div></div>;
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'SOLICITADA'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'CONFIRMADA'),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_published', true),
    supabase.from('barbers').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_published', true),
  ]);
  const error = results.find(item => item.error)?.error;
  return <div className="section-wrap admin-content"><section className="page-hero"><p className="eyebrow">CONTROL ROOM / OVERVIEW</p><h1>EL NEGOCIO, <span>BAJO CONTROL.</span></h1><p>Gestiona las reservas y los datos que ve el público. Lo que no esté publicado no se mostrará como si fuera información oficial.</p></section>
    {error && <div className="notice notice-error">No se pudieron cargar todos los indicadores. Usa las secciones de gestión para revisar los datos.</div>}
    <div className="admin-stats"><article><span>RESERVAS POR REVISAR</span><strong>{results[0].count ?? '—'}</strong><Link href="/admin/reservas">Revisar solicitudes ↗</Link></article><article><span>CITAS CONFIRMADAS</span><strong>{results[1].count ?? '—'}</strong><Link href="/admin/reservas">Abrir agenda ↗</Link></article><article><span>SERVICIOS PUBLICADOS</span><strong>{results[2].count ?? '—'}</strong><Link href="/admin/servicios">Gestionar catálogo ↗</Link></article><article><span>BARBEROS PUBLICADOS</span><strong>{results[3].count ?? '—'}</strong><Link href="/admin/barberos">Gestionar equipo ↗</Link></article></div>
    <div className="admin-shortcuts"><Link href="/admin/configuracion"><span>01</span><strong>Configuración del negocio</strong><small>Contacto, zona horaria y habilitación de reservas</small>↗</Link><Link href="/admin/horarios"><span>02</span><strong>Agenda y bloqueos</strong><small>Horarios semanales, excepciones y tiempo fuera</small>↗</Link><Link href="/admin/galeria"><span>03</span><strong>Contenido visual</strong><small>Subir y publicar fotografías auténticas</small>↗</Link></div>
  </div>;
}

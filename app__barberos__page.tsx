import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicBarbers } from '@/lib/data';
export const metadata: Metadata = { title: 'Barberos' };

export default async function BarbersPage() {
  const result = await getPublicBarbers();
  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">02 / LICENCIAS DEL EQUIPO</p><h1>MANOS CON <span>VISIÓN.</span></h1><p>Conoce a las personas detrás del detalle. Solo publicamos perfiles que el negocio haya revisado y aprobado.</p></section>
    {result.state === 'error' ? <div className="notice notice-error">No pudimos cargar los perfiles del equipo.</div> : result.items.length ? <div className="content-grid">{result.items.map(barber => <article className="content-card" id={barber.slug} key={barber.id}><p className="eyebrow">ROYALTY LICENSE / BARBER</p><h2>{barber.display_name}</h2><p>{barber.biography || 'Biografía pendiente de publicación.'}</p>{barber.specialties.length > 0 && <p>Especialidades: {barber.specialties.join(' · ')}</p>}<Link className="button button-red" href={`/reservar?barbero=${barber.id}`}>Reservar con {barber.display_name.split(' ')[0]} ↗</Link></article>)}</div> : <div className="empty-state"><span className="empty-code">EQUIPO / EN REVISIÓN</span><h3>Perfiles reales, sin inventar biografías.</h3><p>Los perfiles se publicarán cuando estén completas y revisadas sus fotografías, especialidades y presentación oficial.</p></div>}
  </div>;
}

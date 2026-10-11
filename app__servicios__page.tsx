import { formatMoney } from '@/lib/format';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicServices } from '@/lib/data';
export const metadata: Metadata = { title: 'Servicios' };

export default async function ServicesPage() {
  const result = await getPublicServices();
  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">01 / MENÚ DE SERVICIOS</p><h1>ELIGE TU <span>ESTILO.</span></h1><p>Los servicios y tarifas que se muestran son los publicados oficialmente por Royalty Barber Studio.</p></section>
    {result.state === 'error' ? <div className="notice notice-error">No pudimos consultar los servicios. No te mostraremos información desactualizada.</div> : result.items.length ? <div className="content-grid">{result.items.map((service, i) => <article className="content-card" key={service.id}><p className="eyebrow">{String(i + 1).padStart(2, '0')} / {service.category}</p><h2>{service.name}</h2><p>{service.description}</p><p>{service.duration_minutes} minutos · <strong>{formatMoney(service.price, service.currency, 'es')}</strong></p><Link className="button button-red" href={`/reservar?servicio=${service.id}`}>Elegir servicio ↗</Link></article>)}</div> : <div className="empty-state"><span className="empty-code">CATÁLOGO / NO PUBLICADO</span><h3>Primero, datos confirmados.</h3><p>Esta sección se llenará desde el panel del negocio cuando se confirmen los nombres, duración, moneda y precios. No hemos convertido las tarifas provisionales del documento en precios públicos.</p><Link className="text-link" href="/contacto">Consultar por Instagram ↗</Link></div>}
  </div>;
}

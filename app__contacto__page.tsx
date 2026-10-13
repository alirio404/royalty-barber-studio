import type { Metadata } from 'next';
import { getBusinessSettings } from '@/lib/data';
import { getVerifiedBusinessContact } from '@/lib/business-display.mjs';
export const metadata: Metadata = { title: 'Contacto oficial' };

export default async function ContactPage() {
  const result = await getBusinessSettings();
  const business = getVerifiedBusinessContact(result.item);
  const mapUrl = business.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
    : null;

  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">04 / CONTACTO Y UBICACIÓN</p><h1>CONTACTO <span>OFICIAL.</span></h1><p>Publicaremos dirección, teléfono y redes sociales cuando Royalty Barber Studio haya verificado los datos. No mostramos ubicaciones ni perfiles que no estén confirmados.</p></section>
    {result.state === 'error' && <div className="notice notice-error">No se pudo cargar la información oficial de contacto.</div>}
    <div className="contact-grid">
      <article className="contact-card"><p className="eyebrow">UBICACIÓN</p><h2>{business.name}</h2><p>{business.address || 'Dirección pendiente de confirmar.'}</p>{mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer">Abrir mapa ↗</a> : <p className="muted">El mapa estará disponible cuando se confirme la dirección.</p>}</article>
      <article className="contact-card"><p className="eyebrow">CANALES OFICIALES</p><h2>HABLEMOS.</h2>{business.instagramUrl ? <p><a href={business.instagramUrl} target="_blank" rel="noreferrer">Abrir Instagram oficial ↗</a></p> : <p>Instagram oficial pendiente de confirmar.</p>}{business.phone ? <p>Teléfono: <a href={`tel:${business.phone.replace(/[^\d+]/g, '')}`}>{business.phone}</a></p> : <p>Teléfono pendiente de confirmar.</p>}<p>El horario y las reservas se habilitarán cuando la barbería confirme los datos operativos.</p></article>
    </div>
  </div>;
}

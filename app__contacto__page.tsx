import type { Metadata } from 'next';
import { getBusinessSettings } from '@/lib/data';
export const metadata: Metadata = { title: 'Contacto' };

export default async function ContactPage() {
  const result = await getBusinessSettings();
  const business = result.item;
  const addressQuery = business?.address ? encodeURIComponent(business.address) : encodeURIComponent('Royalty Barber Studio, Sanare, Lara, Venezuela');
  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">04 / CONTACTO Y UBICACIÓN</p><h1>ESTAMOS <span>EN SANARE.</span></h1><p>Consulta los canales oficiales y encuentra la ubicación de Royalty Barber Studio.</p></section>
    {result.state === 'error' && <div className="notice notice-error">No se pudo cargar la información de contacto oficial.</div>}
    <div className="contact-grid"><article className="contact-card"><p className="eyebrow">UBICACIÓN</p><h2>{business?.name || 'Royalty Barber Studio'}</h2><p>{business?.address || 'Sanare, Lara, Venezuela'}</p><a href={`https://www.google.com/maps/search/?api=1&query=${addressQuery}`} target="_blank" rel="noreferrer">Abrir mapa ↗</a></article>
      <article className="contact-card"><p className="eyebrow">CANALES OFICIALES</p><h2>HABLEMOS.</h2>{business?.instagram_url ? <p>Instagram: <a href={business.instagram_url} target="_blank" rel="noreferrer">@royaltybarberstudio2026 ↗</a></p> : <p>Instagram: <a href="https://instagram.com/royaltybarberstudio2026" target="_blank" rel="noreferrer">@royaltybarberstudio2026 ↗</a></p>}{business?.phone ? <p>Teléfono: <a href={`tel:${business.phone.replace(/[^\d+]/g, '')}`}>{business.phone}</a></p> : <p>Teléfono: pendiente de confirmar. No publicaremos un número que pueda estar equivocado.</p>}<p>Horario y reservas: se mostrarán en cuanto la barbería confirme sus datos operativos.</p></article>
    </div>
  </div>;
}

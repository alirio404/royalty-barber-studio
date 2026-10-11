import { formatMoney } from '@/lib/format';
import Link from 'next/link';
import { getPublicServices, getPublicBarbers } from '@/lib/data';

export default async function HomePage() {
  const [services, barbers] = await Promise.all([getPublicServices(), getPublicBarbers()]);
  return <>
    <section className="hero-shell section-wrap">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> SANARE · LARA · VENEZUELA</p>
        <h1>NO ES SOLO<br /><span>UN CORTE.</span></h1>
        <p className="hero-serif">Es la forma en que entras al mundo.</p>
        <p className="hero-description">Precisión, carácter y una experiencia premium. Tu próximo look empieza en la silla de Royalty.</p>
        <div className="hero-buttons">
          <Link href="/reservar" className="button button-red">Agenda tu turno <span aria-hidden="true">↗</span></Link>
          <Link href="/servicios" className="button button-outline">Explorar servicios</Link>
        </div>
        <div className="hero-meta"><span>01 / IDENTIDAD</span><span>✦</span><span>ROYALTY BARBER STUDIO</span></div>
      </div>
      <div className="hero-art" aria-label="Emblema Royalty Barber Studio">
        <div className="art-grid" />
        <div className="art-circle art-circle-one" />
        <div className="art-circle art-circle-two" />
        <div className="hero-seal"><span className="seal-crown">♛</span><strong>R</strong><span className="seal-caption">ROYALTY · BARBER</span></div>
        <div className="hero-sticker">CUT<br />ABOVE<br />THE REST</div>
        <span className="art-plus plus-one">✦</span><span className="art-plus plus-two">✳</span>
        <div className="art-vertical">EXPERIENCIA PREMIUM / 2026</div>
      </div>
      <div className="hero-bottomline"><span>✂ PRECISIÓN</span><span>✦ ACTITUD</span><span>♛ ROYALTY</span></div>
    </section>

    <section className="marquee" aria-label="Royalty Barber Studio"><div>PRECISIÓN <b>✦</b> IDENTIDAD <b>✦</b> ACTITUD <b>✦</b> EXPERIENCIA PREMIUM <b>✦</b> PRECISIÓN <b>✦</b> IDENTIDAD <b>✦</b> ACTITUD <b>✦</b></div></section>

    <section className="section-wrap section-block">
      <div className="section-heading"><div><p className="eyebrow">01 / EL CATÁLOGO</p><h2>ELIGE TU <span>ESTILO.</span></h2></div><Link className="text-link" href="/servicios">Ver todos los servicios ↗</Link></div>
      {services.state === 'error' ? <div className="notice notice-error">No se pudo cargar el catálogo. No mostramos precios ni servicios inventados. Intenta de nuevo más tarde.</div> : services.items.length ? <div className="service-grid">{services.items.slice(0, 3).map((service, i) => <article className="service-card" key={service.id}><span className="service-index">0{i + 1}</span><span className="service-symbol">{service.category === 'BARBA' ? '✂' : service.category === 'RITUAL' ? '♛' : '⌁'}</span><h3>{service.name}</h3><p>{service.description}</p><div className="service-card-meta"><span>{service.duration_minutes} MIN</span><strong>{formatMoney(service.price, service.currency, 'es')}</strong></div><Link href={`/reservar?servicio=${service.id}`} className="card-link">Reservar este servicio ↗</Link></article>)}</div> : <div className="empty-state"><span className="empty-code">CATÁLOGO / EN PREPARACIÓN</span><h3>Servicios reales, precios confirmados.</h3><p>El catálogo se mostrará en cuanto se validen las tarifas y se publiquen desde la configuración del negocio. No usamos precios de ejemplo como si fueran definitivos.</p><Link href="/contacto" className="text-link">Consultar con Royalty ↗</Link></div>}
    </section>

    <section className="founder-band"><div className="section-wrap founder-inner"><div><p className="eyebrow">02 / LA BARBERÍA</p><h2>ACTITUD EN<br /><span>CADA DETALLE.</span></h2></div><div className="founder-copy"><p>Una experiencia pensada para quienes entienden que un buen corte no pasa desapercibido. Técnica limpia, identidad fuerte y atención al detalle.</p><Link href="/barberos" className="button button-light">Conoce al equipo ↗</Link></div><span className="founder-ornament">R</span></div></section>

    <section className="section-wrap section-block"><div className="section-heading"><div><p className="eyebrow">03 / EL EQUIPO</p><h2>MANOS CON <span>VISIÓN.</span></h2></div><Link className="text-link" href="/barberos">Conocer barberos ↗</Link></div>
      {barbers.state === 'error' ? <div className="notice notice-error">No se pudo cargar el equipo.</div> : barbers.items.length ? <div className="barber-grid">{barbers.items.slice(0, 2).map((barber) => <article className="barber-card" key={barber.id}><div className="barber-portrait"><span className="portrait-initial">{barber.display_name.slice(0,1)}</span><span className="portrait-tag">ROYALTY LICENSE / ACTIVE</span></div><div className="barber-info"><p className="eyebrow">MASTER CRAFT</p><h3>{barber.display_name}</h3><p>{barber.biography || 'Perfil oficial en preparación.'}</p><Link href={`/barberos#${barber.slug}`} className="text-link">Ver perfil ↗</Link></div></article>)}</div> : <div className="empty-state empty-state-compact"><h3>Equipo oficial en preparación.</h3><p>Publicaremos los perfiles cuando estén revisados y completos.</p></div>}
    </section>

    <section className="final-cta section-wrap"><div className="final-cta-mark">♛</div><p className="eyebrow">TU PRÓXIMO NIVEL</p><h2>EL ESTILO NO<br />SE IMPROVISA<span>.</span></h2><Link href="/reservar" className="button button-red">Agenda tu turno <span aria-hidden="true">↗</span></Link><p className="cta-footnote">Las citas se habilitan cuando el negocio haya publicado sus horarios y servicios confirmados.</p></section>
  </>;
}

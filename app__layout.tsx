import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: { default: 'Royalty Barber Studio | Sanare', template: '%s | Royalty Barber Studio' },
  description: 'Barbería con personalidad en Sanare, Lara, Venezuela. Conoce los servicios y agenda tu turno.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><head>
    <meta name="theme-color" content="#0a0a0a" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Playfair+Display:ital,wght@1,700;1,900&family=Space+Mono:wght@400;700&family=Yellowtail&display=swap" rel="stylesheet" />
  </head><body>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <SiteHeader />
    <main id="contenido">{children}</main>
    <footer className="site-footer">
      <Link className="brand brand-footer" href="/"><span className="brand-mark">R</span><span className="brand-wordmark">ROYALTY<small>BARBER STUDIO</small></span></Link>
      <p>Estilo con carácter. Hecho en Sanare.</p>
      <span className="footer-code">RBS · EXPERIENCIA PREMIUM</span>
    </footer>
  </body></html>;
}

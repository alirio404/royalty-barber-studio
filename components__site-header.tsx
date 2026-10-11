import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';
import { signOutAction } from '@/app/actions';

export async function SiteHeader() {
  let signedIn = false;
  let isAdmin = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
        isAdmin = profile?.role === 'ADMIN';
      }
    } catch {
      signedIn = false;
    }
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Royalty Barber Studio - inicio">
        <span className="brand-mark">R</span>
        <span className="brand-wordmark">ROYALTY<small>BARBER STUDIO</small></span>
      </Link>
      <nav className="main-nav" aria-label="Navegación principal">
        <Link href="/servicios">Servicios</Link>
        <Link href="/barberos">Barberos</Link>
        <Link href="/galeria">Galería</Link>
        <Link href="/contacto">Contacto</Link>
        {signedIn && <Link href="/cuenta/citas">Mis citas</Link>}
        {isAdmin && <Link href="/admin">Administración</Link>}
      </nav>
      <div className="header-actions">
        {signedIn ? <>
          {isAdmin && <Link className="nav-account" href="/admin">Administrar</Link>}
          <Link className="nav-account" href="/cuenta/citas">Mis citas</Link>
          <form action={signOutAction}><button className="text-button" type="submit">Salir</button></form>
        </> : <Link className="nav-account" href="/login">Mi cuenta</Link>}
        <Link className="button button-red button-small" href="/reservar">Agenda tu turno <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}

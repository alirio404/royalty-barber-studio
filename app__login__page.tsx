import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth-forms';
import { isSupabaseConfigured } from '@/lib/data';
export const metadata: Metadata = { title: 'Iniciar sesión', robots: { index: false, follow: false } };

type Search = Promise<{ next?: string }>;
export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/cuenta/citas';
  return <div className="section-wrap"><section className="form-shell"><p className="eyebrow">ROYALTY ACCOUNT / LOGIN</p><h1>VOLVISTE A <span style={{ color: 'var(--red)' }}>CASA.</span></h1><p>Entra para consultar tus citas y gestionar tus reservas.</p>{isSupabaseConfigured() ? <LoginForm nextPath={nextPath} /> : <div className="notice notice-error">La autenticación todavía no está conectada a una base real. No se aceptarán credenciales hasta completar la configuración de Supabase.</div>}<p style={{ marginTop: '1.2rem', fontSize: '.75rem' }}>¿Nuevo por aquí? <Link className="inline-link" href={`/registro?next=${encodeURIComponent(nextPath)}`}>Crea tu cuenta</Link></p></section></div>;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth-forms';
import { isSupabaseConfigured } from '@/lib/data';
export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false, follow: false } };

type Search = Promise<{ next?: string }>;
export default async function RegisterPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/cuenta/citas';
  return <div className="section-wrap"><section className="form-shell"><p className="eyebrow">ROYALTY ACCOUNT / REGISTRO</p><h1>ENTRA AL <span style={{ color: 'var(--red)' }}>CLUB.</span></h1><p>Crea tu cuenta para enviar solicitudes de cita y consultar tu historial.</p>{isSupabaseConfigured() ? <RegisterForm nextPath={nextPath} /> : <div className="notice notice-error">El registro no está habilitado hasta conectar y verificar la autenticación real. No almacenamos cuentas de prueba.</div>}<p style={{ marginTop: '1.2rem', fontSize: '.75rem' }}>¿Ya tienes cuenta? <Link className="inline-link" href={`/login?next=${encodeURIComponent(nextPath)}`}>Inicia sesión</Link></p></section></div>;
}

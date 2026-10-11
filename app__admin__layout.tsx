import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data';

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) return <>{children}</>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fadmin');
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error || profile?.role !== 'ADMIN') redirect('/');
  return <>
    <div className="admin-nav section-wrap"><span className="admin-label">ROYALTY / CONTROL ROOM</span><nav aria-label="Administración"><Link href="/admin">Resumen</Link><Link href="/admin/reservas">Reservas</Link><Link href="/admin/pagos">Pagos</Link><Link href="/admin/servicios">Servicios</Link><Link href="/admin/barberos">Barberos</Link><Link href="/admin/horarios">Horarios</Link><Link href="/admin/galeria">Galería</Link><Link href="/admin/configuracion">Configuración</Link></nav></div>
    {children}
  </>;
}

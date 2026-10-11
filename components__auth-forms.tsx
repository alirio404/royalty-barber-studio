'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function safeNextPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : '/cuenta/citas';
}

export function LoginForm({ nextPath = '/cuenta/citas' }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setSuccess(false);
    try {
      const supabase = createClient();
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      // Safe one-time bootstrap: the server promotes only the verified email configured in INITIAL_ADMIN_EMAIL.
      try { await fetch('/api/admin/bootstrap', { method: 'POST' }); } catch { /* Ordinary client sign-in remains independent of bootstrap. */ }
      const destination = safeNextPath(nextPath);
      if (destination.startsWith('/admin')) {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).maybeSingle();
        if (profileError || profile?.role !== 'ADMIN') {
          setMessage('Tu cuenta no tiene permisos de administración. El acceso de administrador debe configurarse de forma segura antes de entrar.');
          return;
        }
      }
      window.location.assign(destination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
      setSuccess(false);
    } finally { setBusy(false); }
  }

  return <form className="form-card" onSubmit={submit}>
    <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></div>
    <div className="field"><label htmlFor="password">Contraseña</label><input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></div>
    {message && <p className={success ? 'form-success' : 'form-error'} role="status">{message}</p>}
    <button className="button button-red" type="submit" disabled={busy}>{busy ? 'Validando…' : 'Entrar a mi cuenta ↗'}</button>
    <p className="form-help" style={{ marginTop: '1rem' }}>¿Olvidaste la contraseña? <Link className="inline-link" href="/olvide-clave">Recuperar acceso</Link></p>
    <p className="form-help">¿Todavía no tienes cuenta? <Link className="inline-link" href={`/registro?next=${encodeURIComponent(safeNextPath(nextPath))}`}>Crear cuenta</Link></p>
  </form>;
}

export function RegisterForm({ nextPath = '/cuenta/citas' }: { nextPath?: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setSuccess(false);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath(nextPath))}`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim(), phone: phone.trim() || null }, emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      if (data.session) {
        window.location.assign(safeNextPath(nextPath));
        return;
      }
      setSuccess(true);
      setMessage('La solicitud de registro fue enviada. Revisa tu correo para verificar la cuenta antes de entrar.');
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally { setBusy(false); }
  }

  return <form className="form-card" onSubmit={submit}>
    <div className="field"><label htmlFor="full-name">Nombre y apellido</label><input id="full-name" autoComplete="name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></div>
    <div className="field"><label htmlFor="phone">Teléfono (opcional)</label><input id="phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} /></div>
    <div className="field"><label htmlFor="email">Correo electrónico</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></div>
    <div className="field"><label htmlFor="password">Contraseña</label><input id="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /><span className="form-help">Usa al menos 10 caracteres. No uses una contraseña que ya utilices en otra cuenta.</span></div>
    {message && <p className={success ? 'form-success' : 'form-error'} role="status">{message}</p>}
    <button className="button button-red" type="submit" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta ↗'}</button>
    <p className="form-help" style={{ marginTop: '1rem' }}>Crear una cuenta no te suscribe al boletín comercial.</p>
  </form>;
}

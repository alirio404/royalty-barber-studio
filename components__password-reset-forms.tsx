'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function RequestPasswordResetForm() {
  const [email,setEmail]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [sent,setSent]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage('');setSent(false);
    try {const supabase=createClient();const redirectTo=`${window.location.origin}/auth/callback?next=${encodeURIComponent('/cuenta/nueva-clave')}`;const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});if(error)throw error;setSent(true);setMessage('Si ese correo corresponde a una cuenta, recibirás instrucciones para restablecer la contraseña. Revisa también el correo no deseado.');}
    catch(error){setMessage('No se pudo solicitar el correo ahora mismo. Revisa la configuración del servicio de correo o inténtalo de nuevo más tarde.');}
    finally{setBusy(false);}}
  return <form className="form-card" onSubmit={submit}><div className="field"><label htmlFor="reset-email">Correo de tu cuenta</label><input id="reset-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></div>{message&&<p className={sent?'form-success':'form-error'} role="status">{message}</p>}<button className="button button-red" type="submit" disabled={busy}>{busy?'Enviando…':'Enviar instrucciones ↗'}</button><p className="form-help" style={{marginTop:'1rem'}}>El correo solo llegará si el sistema de autenticación y entrega de email están configurados.</p><Link className="inline-link" href="/login">Volver al inicio de sesión</Link></form>;
}

export function SetNewPasswordForm() {
 const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [saved,setSaved]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setMessage('');setSaved(false);if(password!==confirm){setMessage('Las contraseñas no coinciden.');return;}if(password.length<10){setMessage('Usa al menos 10 caracteres.');return;}setBusy(true);
  try{const supabase=createClient();const {data:{user},error:userError}=await supabase.auth.getUser();if(userError||!user)throw new Error('El enlace de recuperación expiró o ya fue utilizado. Solicita uno nuevo.');const {error}=await supabase.auth.updateUser({password});if(error)throw error;setSaved(true);setMessage('Contraseña actualizada. Ya puedes entrar con tu nueva contraseña.');setPassword('');setConfirm('');}
  catch(error){setMessage(error instanceof Error?error.message:'No se pudo cambiar la contraseña.');}finally{setBusy(false);}}
 return <form className="form-card" onSubmit={submit}><div className="field"><label htmlFor="new-password">Nueva contraseña</label><input id="new-password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></div><div className="field"><label htmlFor="confirm-password">Repite la contraseña</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>{message&&<p className={saved?'form-success':'form-error'} role="status">{message}</p>}{saved?<Link href="/login" className="button button-red">Entrar ↗</Link>:<button className="button button-red" type="submit" disabled={busy}>{busy?'Guardando…':'Actualizar contraseña ↗'}</button>}</form>;
}

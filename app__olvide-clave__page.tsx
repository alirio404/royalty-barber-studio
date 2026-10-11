import type { Metadata } from 'next';
import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/data';
import { RequestPasswordResetForm } from '@/components/password-reset-forms';
export const metadata:Metadata={title:'Recuperar contraseña',robots:{index:false,follow:false}};
export default function ForgotPasswordPage(){return <div className="section-wrap"><section className="form-shell"><p className="eyebrow">ROYALTY ACCOUNT / RECUPERACIÓN</p><h1>RECUPERAR <span>ACCESO.</span></h1><p>Envía instrucciones al correo asociado a tu cuenta.</p>{isSupabaseConfigured()?<RequestPasswordResetForm/>:<div className="notice notice-error">La recuperación no está disponible hasta configurar la autenticación y el proveedor de correo.</div>}<p style={{marginTop:'1rem',fontSize:'.75rem'}}><Link className="inline-link" href="/login">Volver al inicio de sesión</Link></p></section></div>}

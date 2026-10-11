import type { Metadata } from 'next';
import { isSupabaseConfigured } from '@/lib/data';
import { SetNewPasswordForm } from '@/components/password-reset-forms';
export const metadata:Metadata={title:'Crear contraseña nueva',robots:{index:false,follow:false}};
export default function NewPasswordPage(){return <div className="section-wrap"><section className="form-shell"><p className="eyebrow">ROYALTY ACCOUNT / SEGURIDAD</p><h1>NUEVA <span>CONTRASEÑA.</span></h1><p>Abre esta página desde el enlace válido que recibiste por correo.</p>{isSupabaseConfigured()?<SetNewPasswordForm/>:<div className="notice notice-error">La recuperación de contraseña no está configurada.</div>}</section></div>}

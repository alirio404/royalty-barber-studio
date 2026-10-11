import type { Metadata } from 'next';
import { getPublicGallery, isSupabaseConfigured } from '@/lib/data';
import { createAdminClient } from '@/lib/supabase/admin';
export const metadata: Metadata = { title: 'Galería' };

export default async function GalleryPage() {
  const result = await getPublicGallery();
  const urls: Record<string, string> = {};
  let storageError = false;
  if (result.items.length && isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      await Promise.all(result.items.map(async (item) => {
        const { data, error } = await admin.storage.from('royalty-gallery').createSignedUrl(item.storage_path, 3600);
        if (error) { storageError = true; return; }
        if (data?.signedUrl) urls[item.id] = data.signedUrl;
      }));
    } catch { storageError = true; }
  }
  const visible = result.items.filter(item => Boolean(urls[item.id]));
  return <div className="section-wrap"><section className="page-hero"><p className="eyebrow">03 / ARCHIVO VISUAL</p><h1>EL TRABAJO <span>HABLA.</span></h1><p>Cortes y acabados reales del equipo. Cada imagen se publica desde la galería oficial del negocio.</p></section>
    {result.state === 'error' || storageError ? <div className="notice notice-error">No pudimos cargar todas las imágenes. No se mostrarán enlaces de almacenamiento sin validar.</div> : null}
    {visible.length ? <div className="gallery-grid">{visible.map(item => <figure className="gallery-tile" key={item.id}><img src={urls[item.id]} alt={item.alt_text || item.title || 'Trabajo de Royalty Barber Studio'} loading="lazy" /><figcaption>{item.title || item.category}</figcaption></figure>)}</div> : result.items.length ? <div className="empty-state"><h3>Las fotos no se pudieron cargar.</h3><p>El sistema conserva las imágenes en almacenamiento privado y necesita revisar su configuración. No se sustituyen por imágenes de relleno.</p></div> : <div className="empty-state"><span className="empty-code">GALLERY.EXE / A LA ESPERA DE FOTOS</span><h3>No usamos fotos de relleno.</h3><p>La galería aparecerá aquí cuando se suban fotografías auténticas del trabajo de Royalty Barber Studio y se apruebe su publicación.</p></div>}
  </div>;
}

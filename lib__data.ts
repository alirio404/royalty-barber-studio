import { createClient } from '@/lib/supabase/server';

export type DataState = 'ok' | 'unconfigured' | 'error';
export type Service = {
  id: string; slug: string; name: string; category: 'CORTES' | 'BARBA' | 'RITUAL';
  description: string; duration_minutes: number; price: string | number; currency: string;
};
export type Barber = {
  id: string; slug: string; display_name: string; biography: string; specialties: string[]; avatar_path: string | null;
};
export type GalleryItem = {
  id: string; title: string; category: string; storage_path: string; alt_text: string; barber_id: string | null;
};
export type BusinessSettings = {
  name: string; address: string | null; phone: string | null; instagram_url: string | null; timezone: string; currency: string | null;
};

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getPublicServices(): Promise<{ state: DataState; items: Service[] }> {
  if (!isSupabaseConfigured()) return { state: 'unconfigured', items: [] };
  try {
    const supabase = await createClient();
    const [servicesRes, linksRes] = await Promise.all([
      supabase.from('services').select('id,slug,name,category,description,duration_minutes,price,currency')
        .eq('is_active', true).eq('is_published', true).order('sort_order'),
      supabase.from('barber_services').select('service_id'),
    ]);
    if (servicesRes.error) throw servicesRes.error;
    if (linksRes.error) throw linksRes.error;
    const bookableIds = new Set((linksRes.data ?? []).map(row => row.service_id));
    return { state: 'ok', items: ((servicesRes.data ?? []).filter(row => bookableIds.has(row.id))) as Service[] };
  } catch (error) {
    console.error('No se pudo consultar el catálogo público.', error);
    return { state: 'error', items: [] };
  }
}

export async function getPublicBarbers(): Promise<{ state: DataState; items: Barber[] }> {
  if (!isSupabaseConfigured()) return { state: 'unconfigured', items: [] };
  try {
    const supabase = await createClient();
    const [barbersRes, linksRes] = await Promise.all([
      supabase.from('barbers').select('id,slug,display_name,biography,specialties,avatar_path')
        .eq('is_active', true).eq('is_published', true).order('sort_order'),
      supabase.from('barber_services').select('barber_id'),
    ]);
    if (barbersRes.error) throw barbersRes.error;
    if (linksRes.error) throw linksRes.error;
    const bookableIds = new Set((linksRes.data ?? []).map(row => row.barber_id));
    return { state: 'ok', items: ((barbersRes.data ?? []).filter(row => bookableIds.has(row.id))) as Barber[] };
  } catch (error) {
    console.error('No se pudo consultar el equipo público.', error);
    return { state: 'error', items: [] };
  }
}

export async function getPublicGallery(): Promise<{ state: DataState; items: GalleryItem[] }> {
  if (!isSupabaseConfigured()) return { state: 'unconfigured', items: [] };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('gallery_items')
      .select('id,title,category,storage_path,alt_text,barber_id')
      .eq('is_published', true).order('sort_order').order('created_at', { ascending: false });
    if (error) throw error;
    return { state: 'ok', items: (data ?? []) as GalleryItem[] };
  } catch (error) {
    console.error('No se pudo consultar la galería pública.', error);
    return { state: 'error', items: [] };
  }
}

export async function getBusinessSettings(): Promise<{ state: DataState; item: BusinessSettings | null }> {
  if (!isSupabaseConfigured()) return { state: 'unconfigured', item: null };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('business_settings')
      .select('name,address,phone,instagram_url,timezone,currency').eq('singleton', true).eq('is_published', true).maybeSingle();
    if (error) throw error;
    return { state: 'ok', item: data as BusinessSettings | null };
  } catch (error) {
    console.error('No se pudo consultar la configuración pública.', error);
    return { state: 'error', item: null };
  }
}

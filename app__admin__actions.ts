'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function adminClient() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login?next=%2Fadmin');
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error || profile?.role !== 'ADMIN') redirect('/');
  return supabase;
}
function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
function checked(formData: FormData, key: string) { return formData.get(key) === 'on'; }
function intField(formData: FormData, key: string, min: number, max: number, errorPath: string) {
  const raw = text(formData, key);
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value < min || value > max) redirect(errorPath);
  return value;
}
function revalidateContent() {
  for (const path of ['/', '/servicios', '/barberos', '/galeria', '/contacto', '/reservar', '/admin', '/admin/servicios', '/admin/barberos', '/admin/horarios', '/admin/configuracion']) revalidatePath(path);
}

export async function saveService(formData: FormData) {
  const supabase = await adminClient();
  const id = text(formData, 'id');
  const slug = text(formData, 'slug').toLowerCase();
  const name = text(formData, 'name');
  const category = text(formData, 'category');
  const description = text(formData, 'description');
  const duration = intField(formData, 'duration_minutes', 5, 360, '/admin/servicios?error=datos');
  const price = Number(text(formData, 'price'));
  const currency = text(formData, 'currency').toUpperCase();
  if (!name || name.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect('/admin/servicios?error=datos');
  if (!Number.isFinite(price) || price < 0 || price > 1000000 || !/^[A-Z]{3}$/.test(currency)) redirect('/admin/servicios?error=precio');
  try { new Intl.NumberFormat('en', { style: 'currency', currency }).format(price); } catch { redirect('/admin/servicios?error=precio'); }
  const { data: businessCurrency, error: currencyReadError } = await supabase.from('business_settings').select('currency,is_published').eq('singleton', true).maybeSingle();
  if (currencyReadError) redirect('/admin/servicios?error=guardar');
  if (businessCurrency?.is_published && String(businessCurrency.currency ?? '').trim().toUpperCase() !== currency) redirect('/admin/servicios?error=moneda');
  if (description.length > 1200) redirect('/admin/servicios?error=datos');
  if (!['CORTES', 'BARBA', 'RITUAL'].includes(category)) redirect('/admin/servicios?error=categoria');
  const record = { slug, name, category, description, duration_minutes: duration, price, currency, is_active: checked(formData, 'is_active'), is_published: checked(formData, 'is_published'), sort_order: Number(text(formData, 'sort_order') || '0') };
  const result = id ? await supabase.from('services').update(record).eq('id', id) : await supabase.from('services').insert(record);
  if (result.error) {
    console.error('Error guardando servicio.', result.error);
    redirect(`/admin/servicios?error=${result.error.code === '23505' ? 'slug' : 'guardar'}`);
  }
  revalidateContent();
  redirect('/admin/servicios?ok=guardado');
}

export async function saveBarber(formData: FormData) {
  const supabase = await adminClient();
  const id = text(formData, 'id');
  const slug = text(formData, 'slug').toLowerCase();
  const display_name = text(formData, 'display_name');
  const biography = text(formData, 'biography');
  const specialties = text(formData, 'specialties').split(',').map(value => value.trim()).filter(Boolean).slice(0, 20);
  const is_active = checked(formData, 'is_active');
  const is_published = checked(formData, 'is_published');
  const serviceIds = formData.getAll('service_ids').map(String).filter(Boolean);
  if (!display_name || display_name.length > 120 || biography.length > 1600 || specialties.some(value => value.length > 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect('/admin/barberos?error=datos');
  let barberId = id;
  const record = { slug, display_name, biography, specialties, is_active, is_published, sort_order: Number(text(formData, 'sort_order') || '0') };
  if (id) {
    const { error } = await supabase.from('barbers').update(record).eq('id', id);
    if (error) { console.error('Error guardando barbero.', error); redirect(`/admin/barberos?error=${error.code === '23505' ? 'slug' : 'guardar'}`); }
  } else {
    const { data, error } = await supabase.from('barbers').insert(record).select('id').single();
    if (error || !data) { console.error('Error creando barbero.', error); redirect(`/admin/barberos?error=${error?.code === '23505' ? 'slug' : 'guardar'}`); }
    barberId = data.id;
  }
  const { data: previous } = await supabase.from('barber_services').select('service_id').eq('barber_id', barberId);
  const { error: removeError } = await supabase.from('barber_services').delete().eq('barber_id', barberId);
  if (removeError) { console.error('Error actualizando servicios del barbero.', removeError); redirect('/admin/barberos?error=relacion'); }
  if (serviceIds.length) {
    const { error: addError } = await supabase.from('barber_services').insert(serviceIds.map(service_id => ({ barber_id: barberId, service_id })));
    if (addError) {
      if (previous?.length) await supabase.from('barber_services').insert(previous.map(row => ({ barber_id: barberId, service_id: row.service_id })));
      console.error('Error asociando servicios al barbero.', addError);
      redirect('/admin/barberos?error=relacion');
    }
  }
  revalidateContent();
  redirect('/admin/barberos?ok=guardado');
}

export async function saveSchedule(formData: FormData) {
  const supabase = await adminClient();
  const barber_id = text(formData, 'barber_id');
  const day_of_week = intField(formData, 'day_of_week', 0, 6, '/admin/horarios?error=fecha');
  const is_closed = checked(formData, 'is_closed');
  const opens_at = text(formData, 'opens_at') || '10:00';
  const closes_at = text(formData, 'closes_at') || '20:00';
  if (!barber_id) redirect('/admin/horarios?error=barbero');
  if (!is_closed && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(opens_at) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closes_at) || opens_at >= closes_at || Number(opens_at.slice(3)) % 15 !== 0 || Number(closes_at.slice(3)) % 15 !== 0)) redirect('/admin/horarios?error=horas');
  const { error } = await supabase.from('schedules').upsert({ barber_id, day_of_week, is_closed, opens_at, closes_at }, { onConflict: 'barber_id,day_of_week' });
  if (error) { console.error('Error guardando horario.', error); redirect('/admin/horarios?error=guardar'); }
  revalidatePath('/admin/horarios'); revalidatePath('/reservar');
  redirect('/admin/horarios?ok=horario');
}

export async function saveException(formData: FormData) {
  const supabase = await adminClient();
  const barber_id = text(formData, 'barber_id');
  const exception_date = text(formData, 'exception_date');
  const is_closed = checked(formData, 'is_closed');
  const opens_at = text(formData, 'opens_at');
  const closes_at = text(formData, 'closes_at');
  const reason = text(formData, 'reason');
  if (!barber_id || !/^\d{4}-\d{2}-\d{2}$/.test(exception_date)) redirect('/admin/horarios?error=fecha');
  if (!is_closed && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(opens_at) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closes_at) || opens_at >= closes_at || Number(opens_at.slice(3)) % 15 !== 0 || Number(closes_at.slice(3)) % 15 !== 0)) redirect('/admin/horarios?error=horas');
  const { error } = await supabase.from('schedule_exceptions').upsert({ barber_id, exception_date, is_closed, opens_at: is_closed ? null : opens_at, closes_at: is_closed ? null : closes_at, reason }, { onConflict: 'barber_id,exception_date' });
  if (error) { console.error('Error guardando excepción de horario.', error); redirect('/admin/horarios?error=guardar'); }
  revalidatePath('/admin/horarios'); revalidatePath('/reservar');
  redirect('/admin/horarios?ok=excepcion');
}

export async function createScheduleBlock(formData: FormData) {
  const supabase = await adminClient();
  const barber_id = text(formData, 'barber_id');
  const starts_at = text(formData, 'starts_at');
  const ends_at = text(formData, 'ends_at');
  const reason = text(formData, 'reason');
  if (!barber_id || !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(starts_at) || !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(ends_at) || Number(starts_at.slice(14,16)) % 15 !== 0 || Number(ends_at.slice(14,16)) % 15 !== 0 || reason.length > 250) redirect('/admin/horarios?error=bloque');
  // datetime-local inputs are local wall-clock values. The barber shop is in Venezuela (UTC-04:00).
  const starts = new Date(`${starts_at}:00-04:00`);
  const ends = new Date(`${ends_at}:00-04:00`);
  if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || starts >= ends) redirect('/admin/horarios?error=bloque');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('schedule_blocks').insert({ barber_id, starts_at: starts.toISOString(), ends_at: ends.toISOString(), reason, created_by: user?.id });
  if (error) { console.error('Error creando bloqueo.', error); redirect(`/admin/horarios?error=${error.code === 'P0001' ? 'conflicto' : 'bloque'}`); }
  revalidatePath('/admin/horarios'); revalidatePath('/reservar');
  redirect('/admin/horarios?ok=bloque');
}

export async function deleteScheduleRecord(formData: FormData) {
  const supabase = await adminClient();
  const table = text(formData, 'table');
  const id = text(formData, 'id');
  if (!['schedule_exceptions', 'schedule_blocks'].includes(table) || !id) redirect('/admin/horarios?error=eliminar');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { console.error('Error eliminando registro de horario.', error); redirect('/admin/horarios?error=eliminar'); }
  revalidatePath('/admin/horarios'); revalidatePath('/reservar');
  redirect('/admin/horarios?ok=eliminado');
}

export async function updateAppointmentStatus(formData: FormData) {
  const supabase = await adminClient();
  const id = text(formData, 'id');
  const status = text(formData, 'status');
  if (!id || !['CONFIRMADA', 'CANCELADA', 'EN_PROCESO', 'COMPLETADA', 'NO_ASISTIO'].includes(status)) redirect('/admin/reservas?error=datos');
  const { data: current, error: readError } = await supabase.from('appointments').select('status').eq('id', id).maybeSingle();
  if (readError || !current) redirect('/admin/reservas?error=estado');
  const allowed: Record<string, string[]> = {
    SOLICITADA: ['CONFIRMADA', 'CANCELADA'],
    CONFIRMADA: ['EN_PROCESO', 'CANCELADA'],
    EN_PROCESO: ['COMPLETADA', 'NO_ASISTIO'],
  };
  if (!allowed[current.status]?.includes(status)) redirect('/admin/reservas?error=transicion');
  const { data: updated, error } = await supabase.from('appointments').update({ status }).eq('id', id).eq('status', current.status).select('id').maybeSingle();
  if (error || !updated) { if (error) console.error('Error actualizando estado de cita.', error); redirect('/admin/reservas?error=estado'); }
  revalidatePath('/admin/reservas'); revalidatePath('/cuenta/citas');
  redirect('/admin/reservas?ok=estado');
}

export async function saveBusinessSettings(formData: FormData) {
  const supabase = await adminClient();
  const name = text(formData, 'name');
  const address = text(formData, 'address');
  const phone = text(formData, 'phone');
  const instagram_url = text(formData, 'instagram_url');
  const timezone = text(formData, 'timezone');
  const currency = text(formData, 'currency').toUpperCase();
  const booking_horizon_days = intField(formData, 'booking_horizon_days', 1, 90, '/admin/configuracion?error=datos');
  const booking_min_notice_minutes = intField(formData, 'booking_min_notice_minutes', 0, 10080, '/admin/configuracion?error=datos');
  const cancellation_min_notice_minutes = intField(formData, 'cancellation_min_notice_minutes', 0, 10080, '/admin/configuracion?error=datos');
  const is_published = checked(formData, 'is_published');
  if (!name || name.length > 120 || !timezone || !/^[A-Z]{3}$/.test(currency)) redirect('/admin/configuracion?error=datos');
  try { new Intl.NumberFormat('en', { style: 'currency', currency }).format(1); } catch { redirect('/admin/configuracion?error=datos'); }
  try { new Intl.DateTimeFormat('es', { timeZone: timezone }).format(new Date()); } catch { redirect('/admin/configuracion?error=zona'); }
  if (instagram_url && !/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/.test(instagram_url)) redirect('/admin/configuracion?error=instagram');
  if (is_published) {
    if (!address || !phone) redirect('/admin/configuracion?error=contacto');
    const [services, barbers, mappings, schedules] = await Promise.all([
      supabase.from('services').select('id,currency').eq('is_active', true).eq('is_published', true),
      supabase.from('barbers').select('id').eq('is_active', true).eq('is_published', true),
      supabase.from('barber_services').select('service_id,barber_id'),
      supabase.from('schedules').select('barber_id,day_of_week').eq('is_closed', false),
    ]);
    if (services.error || barbers.error || mappings.error || schedules.error) redirect('/admin/configuracion?error=preparacion');
    const liveServices = services.data ?? [];
    const liveBarbers = barbers.data ?? [];
    const liveServiceIds = new Set(liveServices.map(row => row.id));
    const liveBarberIds = new Set(liveBarbers.map(row => row.id));
    const activeMappings = (mappings.data ?? []).filter(row => liveServiceIds.has(row.service_id) && liveBarberIds.has(row.barber_id));
    const servicesWithBarber = new Set(activeMappings.map(row => row.service_id));
    const barbersWithService = new Set(activeMappings.map(row => row.barber_id));
    const barbersWithHours = new Set((schedules.data ?? []).map(row => row.barber_id));
    const inconsistentCurrency = liveServices.some(row => String(row.currency).trim().toUpperCase() !== currency);
    if (liveServices.length < 1 || liveBarbers.length < 1 || activeMappings.length < 1 ||
        liveServices.some(row => !servicesWithBarber.has(row.id)) ||
        liveBarbers.some(row => !barbersWithService.has(row.id) || !barbersWithHours.has(row.id)) ||
        inconsistentCurrency) redirect('/admin/configuracion?error=preparacion');
  }
  const { error } = await supabase.from('business_settings').upsert({ singleton: true, name, address: address || null, phone: phone || null, instagram_url: instagram_url || null, timezone, currency, booking_horizon_days, booking_min_notice_minutes, cancellation_min_notice_minutes, is_published }, { onConflict: 'singleton' });
  if (error) { console.error('Error guardando configuración.', error); redirect('/admin/configuracion?error=guardar'); }
  revalidateContent(); revalidatePath('/admin/configuracion');
  redirect('/admin/configuracion?ok=guardado');
}

export async function saveGalleryItem(formData: FormData) {
  const supabase = await adminClient();
  const file = formData.get('file');
  const title = text(formData, 'title');
  const alt_text = text(formData, 'alt_text');
  const category = text(formData, 'category');
  const barber_id = text(formData, 'barber_id');
  const is_published = checked(formData, 'is_published');
  if (!(file instanceof File) || file.size === 0 || file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) redirect('/admin/galeria?error=archivo');
  if (!alt_text || !['GENERAL', 'FADES', 'TEXTURING', 'FUEGO', 'BARBERIA'].includes(category) || alt_text.length > 200 || title.length > 120) redirect('/admin/galeria?error=datos');
  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = file.type === 'image/jpeg' && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const isPng = file.type === 'image/png' && signature.length >= 8 && signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47 && signature[4] === 0x0d && signature[5] === 0x0a && signature[6] === 0x1a && signature[7] === 0x0a;
  const isWebp = file.type === 'image/webp' && signature.length >= 12 && String.fromCharCode(...signature.slice(0,4)) === 'RIFF' && String.fromCharCode(...signature.slice(8,12)) === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) redirect('/admin/galeria?error=archivo');
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `gallery/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('royalty-gallery').upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) { console.error('Error subiendo imagen.', uploadError); redirect('/admin/galeria?error=subida'); }
  const { error } = await supabase.from('gallery_items').insert({ title, alt_text, category, barber_id: barber_id || null, storage_path: path, is_published });
  if (error) {
    await supabase.storage.from('royalty-gallery').remove([path]);
    console.error('Error guardando imagen.', error);
    redirect('/admin/galeria?error=guardar');
  }
  revalidatePath('/galeria'); revalidatePath('/admin/galeria');
  redirect('/admin/galeria?ok=imagen');
}

export async function deleteGalleryItem(formData: FormData) {
  const supabase = await adminClient();
  const id = text(formData, 'id');
  if (!id) redirect('/admin/galeria?error=eliminar');
  const { data: item, error: readError } = await supabase.from('gallery_items').select('storage_path').eq('id', id).single();
  if (readError || !item) redirect('/admin/galeria?error=eliminar');
  const { error: removeRowError } = await supabase.from('gallery_items').delete().eq('id', id);
  if (removeRowError) redirect('/admin/galeria?error=eliminar');
  const { error: removeImageError } = await supabase.storage.from('royalty-gallery').remove([item.storage_path]);
  if (removeImageError) console.error('La entrada se eliminó, pero el archivo puede requerir limpieza.', removeImageError);
  revalidatePath('/galeria'); revalidatePath('/admin/galeria');
  redirect('/admin/galeria?ok=eliminado');
}


/** Records an in-person/external payment entry; it does not charge or refund money online. */
export async function recordPayment(formData: FormData) {
  const supabase = await adminClient();
  const appointment_id = text(formData, 'appointment_id');
  const amount = Number(text(formData, 'amount'));
  const status = text(formData, 'status');
  const provider = text(formData, 'provider');
  const provider_reference = text(formData, 'provider_reference');
  if (!appointment_id || !Number.isFinite(amount) || amount <= 0 || amount > 10000000 || !['PENDIENTE', 'PAGADO', 'PARCIAL', 'FALLIDO', 'REEMBOLSADO'].includes(status) || provider.length > 120 || provider_reference.length > 200) {
    redirect('/admin/pagos?error=datos');
  }
  const { data: appointment, error: appointmentError } = await supabase.from('appointments')
    .select('id,currency,quoted_price,status').eq('id', appointment_id).single();
  if (appointmentError || !appointment) redirect('/admin/pagos?error=cita');
  const currency = String(appointment.currency).trim();
  const { error } = await supabase.from('payments').insert({
    appointment_id, amount, currency, status, provider: provider || null,
    provider_reference: provider_reference || null,
    paid_at: ['PAGADO', 'PARCIAL', 'REEMBOLSADO'].includes(status) ? new Date().toISOString() : null,
  });
  if (error) { console.error('No se pudo registrar el movimiento de pago.', error); redirect('/admin/pagos?error=guardar'); }
  revalidatePath('/admin/pagos'); revalidatePath('/admin'); revalidatePath('/cuenta/citas');
  redirect('/admin/pagos?ok=guardado');
}

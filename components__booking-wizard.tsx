'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Service = { id: string; name: string; category: string; duration_minutes: number; price: number | string; currency: string };
type Barber = { id: string; display_name: string };
type LinkRow = { service_id: string; barber_id: string };
type Appointment = { public_code: string; status: string; starts_at: string; ends_at: string; quoted_price: number; currency: string };

function businessDateToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function showTime(iso: string) {
  return new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso));
}
function formatMoney(price: number | string, currency: string) {
  try { return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(Number(price)); }
  catch { return `${price} ${currency}`; }
}

export function BookingWizard({ initialServiceId = '', initialBarberId = '' }: { initialServiceId?: string; initialBarberId?: string }) {
  const today = businessDateToday();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [bookingHorizonDays, setBookingHorizonDays] = useState(10);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [barberId, setBarberId] = useState(initialBarberId);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/catalog', { cache: 'no-store' }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo cargar el catálogo.');
      if (alive) {
        setServices(body.services ?? []);
        setBarbers(body.barbers ?? []);
        setLinks(body.barberServices ?? []);
        setBookingEnabled(Boolean(body.settings));
        setBookingHorizonDays(Number.isInteger(body.settings?.booking_horizon_days) ? Math.min(90, Math.max(1, body.settings.booking_horizon_days)) : 10);
        setServiceId(current => body.services?.some((item: Service) => item.id === current) ? current : (body.services?.some((item: Service) => item.id === initialServiceId) ? initialServiceId : (body.services?.[0]?.id || '')));
        setBarberId(current => body.barbers?.some((item: Barber) => item.id === current) ? current : (body.barbers?.some((item: Barber) => item.id === initialBarberId) ? initialBarberId : (body.barbers?.[0]?.id || '')));
      }
    }).catch(err => { if (alive) setError(err.message || 'No se pudo cargar el catálogo.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [initialBarberId, initialServiceId]);

  const eligibleBarbers = useMemo(() => {
    if (!serviceId) return [];
    const eligibleIds = new Set(links.filter(row => row.service_id === serviceId).map(row => row.barber_id));
    return barbers.filter(barber => eligibleIds.has(barber.id));
  }, [barbers, links, serviceId]);
  const selectedService = services.find(service => service.id === serviceId);
  const selectedBarber = eligibleBarbers.find(barber => barber.id === barberId);

  useEffect(() => {
    if (!eligibleBarbers.some(barber => barber.id === barberId)) setBarberId(eligibleBarbers[0]?.id ?? '');
    setSlots([]); setStartsAt('');
  }, [serviceId, eligibleBarbers, barberId]);

  async function loadSlots() {
    setError(''); setSlots([]); setStartsAt('');
    if (!serviceId || !barberId || !date) { setError('Selecciona un servicio, un barbero y una fecha.'); return; }
    setBusy(true);
    try {
      const params = new URLSearchParams({ serviceId, barberId, date });
      const response = await fetch(`/api/appointments/availability?${params}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo consultar la disponibilidad.');
      setSlots(body.slots ?? []);
      if (!body.slots?.length) setError('No hay horas disponibles para esta combinación. Prueba otra fecha.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Error consultando disponibilidad.'); }
    finally { setBusy(false); }
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!startsAt || !selectedService || !selectedBarber) { setError('Selecciona un horario disponible antes de continuar.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, barberId, startsAt, customerNote: note }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo registrar la solicitud.');
      setAppointment(body.appointment); setSlots([]); setStartsAt('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar la solicitud.'); }
    finally { setBusy(false); }
  }

  if (appointment) return <section className="booking-panel" aria-live="polite"><p className="eyebrow">SOLICITUD REGISTRADA</p><h2 className="gold-text">Tu solicitud ya está guardada.</h2><p>Código de seguimiento: <strong>{appointment.public_code}</strong></p><p>Estado: <span className="appointment-status">{appointment.status}</span></p><p>Fecha y hora: {new Intl.DateTimeFormat('es-VE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Caracas' }).format(new Date(appointment.starts_at))}</p><p>Esto es una solicitud, no una confirmación automática. La barbería debe confirmarla desde el panel de gestión.</p><Link className="button button-red" href="/cuenta/citas">Ver mis citas ↗</Link></section>;

  if (loading) return <div className="booking-panel" role="status">Cargando servicios publicados…</div>;
  if (!bookingEnabled) return <div className="booking-panel"><span className="empty-code">RESERVAS / PAUSADAS POR EL NEGOCIO</span><h2>La barbería aún no ha activado las reservas online.</h2><p>No mostraremos huecos ni aceptaremos citas hasta que un administrador publique los datos del negocio y compruebe horarios, servicios y precios.</p><Link href="/contacto" className="text-link">Consultar los canales oficiales ↗</Link></div>;
  if (!services.length || !barbers.length || !links.length) return <div className="booking-panel"><span className="empty-code">RESERVAS / TODAVÍA NO HABILITADAS</span><h2>Falta configurar el catálogo.</h2><p>Las reservas se activarán cuando la barbería publique servicios, precios, horarios y barberos válidos. No se muestran horarios ni se aceptan reservas de prueba.</p><Link href="/contacto" className="text-link">Consultar datos de contacto ↗</Link>{error && <p className="form-error">{error}</p>}</div>;

  return <form className="booking-panel" onSubmit={submitBooking}>
    <p className="step-label">PASO 01 / SERVICIO Y BARBERO</p>
    <div className="field"><label htmlFor="service">Servicio</label><select id="service" value={serviceId} onChange={event => setServiceId(event.target.value)} required><option value="">Selecciona un servicio</option>{services.map(service => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min · {formatMoney(service.price, service.currency)}</option>)}</select></div>
    <div className="field"><label htmlFor="barber">Barbero</label><select id="barber" value={barberId} onChange={event => setBarberId(event.target.value)} required><option value="">Selecciona un barbero</option>{eligibleBarbers.map(barber => <option key={barber.id} value={barber.id}>{barber.display_name}</option>)}</select></div>
    <p className="step-label">PASO 02 / FECHA Y DISPONIBILIDAD</p>
    <div className="field"><label htmlFor="date">Fecha</label><input id="date" type="date" value={date} min={today} max={addDays(today, bookingHorizonDays)} onChange={event => { setDate(event.target.value); setSlots([]); setStartsAt(''); }} required /></div>
    <button className="button button-outline" type="button" onClick={loadSlots} disabled={busy || !serviceId || !barberId}>{busy ? 'Consultando…' : 'Consultar horas disponibles'}</button>
    {slots.length > 0 && <><p className="step-label" style={{ marginTop: '1.6rem' }}>PASO 03 / ELIGE UNA HORA</p><div className="slot-grid">{slots.map(slot => <button className="slot-button" type="button" key={slot} aria-pressed={startsAt === slot} onClick={() => setStartsAt(slot)}>{showTime(slot)}</button>)}</div></>}
    <div className="field"><label htmlFor="note">Nota para la barbería (opcional)</label><textarea id="note" maxLength={1000} rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Indicación útil para tu servicio; no incluyas datos sensibles." /></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className={`button button-red ${!startsAt ? 'disabled-button' : ''}`} type="submit" disabled={busy || !startsAt}>{busy ? 'Registrando…' : 'Enviar solicitud de cita ↗'}</button>
    <p className="form-help">La hora vuelve a validarse en el servidor al guardar para evitar citas solapadas. La solicitud no se considera confirmada hasta que la barbería la apruebe.</p>
  </form>;
}

'use client';

import { useState } from 'react';

export function CancelAppointmentButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function cancel() {
    if (!window.confirm('¿Quieres solicitar la cancelación de esta cita?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cancelar la cita.');
      window.location.reload();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cancelar la cita.'); }
    finally { setBusy(false); }
  }
  return <div><button type="button" className="button button-outline" disabled={busy} onClick={cancel}>{busy ? 'Cancelando…' : 'Cancelar cita'}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}

export function formatMoney(amount: number | string, currency: string, locale = 'es-VE') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.trim() }).format(Number(amount));
  } catch {
    return `${amount} ${currency.trim()}`.trim();
  }
}

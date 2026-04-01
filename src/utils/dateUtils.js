/** 
 * All date/time helpers force UTC+5 (Tashkent) so the app
 * displays the correct local time regardless of where the
 * server (Render, Vercel, etc.) is physically hosted.
 */

const TZ = 'Asia/Tashkent'; // UTC+5, no DST

/**
 * Convert any date value to a Date object adjusted to UTC+5.
 * The returned Date is a regular JS Date whose local getHours/getMinutes
 * already reflect Tashkent time — useful for display only.
 */
export const toTashkent = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

/**
 * Format time only: "09:30"
 */
export const formatTime = (value, lang = 'uz') => {
  const d = toTashkent(value);
  if (!d) return '--:--';
  return d.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  });
};

/**
 * Format date only: "01 Apr"
 */
export const formatDate = (value, lang = 'uz') => {
  const d = toTashkent(value);
  if (!d) return '--';
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: 'short',
    timeZone: TZ
  });
};

/**
 * Format full datetime: "01 Apr 2026  09:30"
 */
export const formatDateTime = (value, lang = 'uz') => {
  const d = toTashkent(value);
  if (!d) return '--';
  const datePart = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: 'long',
    timeZone: TZ
  });
  const timePart = d.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  });
  return `${datePart}  ${timePart}`;
};

/**
 * Format full date with year: "01 Apr 2026"
 */
export const formatDateFull = (value, lang = 'uz') => {
  const d = toTashkent(value);
  if (!d) return '--';
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TZ
  });
};

/**
 * Get current time in UTC+5
 */
export const nowTashkent = () => new Date();

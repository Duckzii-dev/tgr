// volume = weight * reps
export function volume(weight, reps) {
  return Number(weight) * Number(reps);
}

// Epley 1RM (skip if reps > 20 to avoid meaningless values)
export function epley1RM(weight, reps) {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r || r <= 0 || r > 20) return null;
  return +(w * (1 + r / 30)).toFixed(2);
}

export function durationSeconds(start, end) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000));
}

export function isoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Trả về YYYY-MM-DD theo timezone chỉ định (IANA).
 */
export function dateKeyInTz(date, timezone = 'UTC') {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date(date)); // en-CA → YYYY-MM-DD
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

/**
 * Trả về {year, month} theo timezone.
 */
export function yearMonthInTz(date, timezone = 'UTC') {
  const key = dateKeyInTz(date, timezone);
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

/**
 * ISO week key theo timezone.
 */
export function isoWeekInTz(date, timezone = 'UTC') {
  const key = dateKeyInTz(date, timezone);
  const [y, m, d] = key.split('-').map(Number);
  const local = new Date(Date.UTC(y, m - 1, d));
  const day = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((local - yearStart) / 86400000 + 1) / 7);
  return `${local.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
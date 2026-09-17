// ============================================================
// VOLUME
// ============================================================
export function volume(weight, reps) {
  return Number(weight) * Number(reps);
}

// ============================================================
// e1RM với RIR adjustment
//
// Công thức:
//   e1RM = Weight × (1 + (Reps + RIR) / 30)
//
// Trong đó:
//   - Reps = số rep thực hiện
//   - RIR  = Reps In Reserve (số rep còn dự trữ)
//   - Reps + RIR = số rep ước tính nếu set tới failure
//
// Quy tắc:
//   - Nếu có RIR → dùng RIR adjustment.
//   - Nếu không có RIR → Epley chuẩn (RIR = 0, tức coi như sát failure).
//   - Chỉ tính cho reps ≤ 20 (trên ngưỡng này e1RM thiếu chính xác).
//   - RIR hợp lệ: 0-5. Trên 5 → coi là 5 (chặn ảnh hưởng quá lớn).
// ============================================================
export function epley1RM(weight, reps, rir = null) {
  const w = Number(weight);
  const r = Number(reps);

  if (!w || !r || r <= 0) return null;

  // Chỉ tính cho reps ≤ 20
  if (r > 20) return null;

  // Clamp RIR: 0-5, mặc định 0 nếu null/undefined
  let effectiveRir = 0;
  if (rir != null) {
    effectiveRir = Math.max(0, Math.min(5, Number(rir) || 0));
  }

  const totalReps = r + effectiveRir;

  // Nếu total reps > 25 → quá xa failure → không đáng tin
  if (totalReps > 25) return null;

  const e1rm = w * (1 + totalReps / 30);
  return +e1rm.toFixed(2);
}

// ============================================================
// e1RM dùng actual 1RM nếu user thực sự test 1RM
// ============================================================
export function effective1RM(weight, reps, rir = null, actual1RM = null) {
  if (actual1RM != null && Number(actual1RM) > 0) {
    return Number(actual1RM);
  }
  return epley1RM(weight, reps, rir);
}

// ============================================================
// Duration (giữ nguyên)
// ============================================================
export function durationSeconds(start, end) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000));
}

// ============================================================
// ISO week (giữ nguyên)
// ============================================================
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

// ============================================================
// Timezone helpers (giữ nguyên)
// ============================================================
export function dateKeyInTz(date, timezone = 'UTC') {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

export function yearMonthInTz(date, timezone = 'UTC') {
  const key = dateKeyInTz(date, timezone);
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

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

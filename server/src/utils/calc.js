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
    const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
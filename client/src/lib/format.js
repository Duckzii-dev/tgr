export function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  export function fmtDuration(sec) {
    if (!sec && sec !== 0) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  
  export function fmtNumber(n, digits = 0) {
    if (n == null) return '—';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
  }
  
  export function iso(d) {
    return new Date(d).toISOString().slice(0, 10);
  }
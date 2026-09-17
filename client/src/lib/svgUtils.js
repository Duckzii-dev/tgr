export function slugifyId(id) {
  return String(id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function svgUrl(id) {
  return `/static/muscle-maps/${slugifyId(id)}.svg`;
}

export function cleanSvg(text) {
  return text
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

const _cache = new Map();

export async function fetchSvg(id) {
  if (_cache.has(id)) return _cache.get(id);
  const res = await fetch(svgUrl(id));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const cleaned = cleanSvg(text);
  _cache.set(id, cleaned);
  return cleaned;
}

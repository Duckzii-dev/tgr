import { useEffect, useRef, useState } from 'react';

const svgCache = new Map();

function slugifyId(id) {
  return String(id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export default function LazySvg({ exerciseId, className }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [svg, setSvg] = useState(() => svgCache.get(exerciseId) || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (svg) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [svg]);

  useEffect(() => {
    if (!visible || svg) return;
    let cancelled = false;
    const slug = slugifyId(exerciseId);
    fetch(`/static/muscle-maps/${slug}.svg`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const cleaned = text
          .replace(/<\?xml[^?]*\?>/g, '')
          .replace(/<--- 38.46.226.72 ping statistics[\s\S]*?-->/g, '')
          .trim();
        svgCache.set(exerciseId, cleaned);
        setSvg(cleaned);
      })
      .catch(() => { if (!cancelled) setError(true); });

    return () => { cancelled = true; };
  }, [visible, svg, exerciseId]);

  return (
    <div ref={ref} className={className}>
      {svg ? (
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{
            __html: svg.replace(
              /<svg([^>]*)>/,
              '<svg$1 style="max-width:100%;max-height:100%;width:auto;height:auto;display:block;">'
            ),
          }}
        />
      ) : error ? (
        <div className="text-xs text-ink-500">No preview</div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-ink-500 animate-pulse">
          ...
        </div>
      )}
    </div>
  );
}

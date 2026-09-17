import { useEffect, useRef, useState } from 'react';
import { slugifyId } from '../lib/svgUtils.js';

/**
 * Lazy load SVG khi element vào viewport.
 * Cache SVG string để không fetch lại.
 */

const svgCache = new Map();

export default function LazySvg({ exerciseId, className, style, alt }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [svg, setSvg] = useState(() => svgCache.get(exerciseId) || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (svg) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [svg]);

  useEffect(() => {
    if (!visible || svg) return;
    let cancelled = false;
    const slug = slugifyId(exerciseId);
    const url = `/static/muscle-maps/${slug}.svg`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const cleaned = text
          .replace(/<\?xml[^?]*\?>/g, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim();
        svgCache.set(exerciseId, cleaned);
        setSvg(cleaned);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => { cancelled = true; };
  }, [visible, svg, exerciseId]);

  return (
    <div ref={ref} className={className} style={style}>
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

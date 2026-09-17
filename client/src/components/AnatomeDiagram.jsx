import { useMemo, useState } from 'react';
import { buildAnatomeUrl } from '../lib/anatome.js';

/**
 * Render muscle diagram.
 * Ưu tiên local SVG nếu có, fallback sang Anatome API.
 */
export default function AnatomeDiagram({
  recovery = [],
  view = 'front',
  gender = 'male',
  width = 240,
  height = 480,
}) {
  const [status, setStatus] = useState('loading');

  const url = useMemo(
    () => buildAnatomeUrl(recovery, view, gender),
    [recovery, view, gender]
  );

  return (
    <div className="relative" style={{ width, height }}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-850/50 rounded-xl animate-pulse">
          <span className="text-xs text-ink-400">Loading diagram...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-850/50 rounded-xl border border-red-500/30">
          <div className="text-center px-4">
            <div className="text-xs text-red-400 mb-1">Diagram unavailable</div>
            <div className="text-[10px] text-ink-500">API offline</div>
          </div>
        </div>
      )}
      <img
        src={url}
        alt={`Muscle diagram ${view}`}
        width={width}
        height={height}
        style={{
          width,
          height,
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 400ms ease',
          display: 'block',
        }}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

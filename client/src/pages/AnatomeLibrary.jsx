import { useState, useEffect } from 'react';
import { Search, Filter, X, Play, Activity, BookOpen } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import { fmtNumber } from '../lib/format.js';

function slugifyId(id) {
  return String(id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getLocalMapUrl(exId) {
  return `/static/muscle-maps/${slugifyId(exId)}.svg`;
}

export default function AnatomeLibrary() {
  const [q, setQ] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);

  const facets = useFetch(() => api.get('/anatome/facets'), []);
  const meta = useFetch(() => api.get('/anatome/meta'), []);

  const { data, loading } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (muscleSlug) p.set('muscleSlug', muscleSlug);
      p.set('limit', '100');
      return api.get(`/anatome/exercises?${p}`);
    },
    [q, muscleSlug]
  );

  const exercises = data?.exercises || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-accent" />
        <div>
          <h1 className="text-2xl font-semibold">Exercise Library</h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {fmtNumber(meta.data?.total) || '...'} bài tập · SVG local
          </p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Tìm bài tập (vd: bench, squat, curl)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            className={`btn btn-ghost ${showFilters ? 'border-accent text-accent' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="w-4 h-4" /> Muscle
          </button>
        </div>

        {showFilters && (
          <div className="pt-2 border-t border-ink-700">
            <label className="label">Muscle</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {muscleSlug && (
                <button
                  className="chip border-accent text-accent"
                  onClick={() => setMuscleSlug('')}
                >
                  <X className="w-3 h-3" /> {muscleSlug}
                </button>
              )}
              {(facets.data?.muscleSlugs || []).slice(0, 40).map((m) => (
                <button
                  key={m}
                  className={`chip ${muscleSlug === m ? 'border-accent text-accent' : ''}`}
                  onClick={() => setMuscleSlug(muscleSlug === m ? '' : m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : exercises.length ? (
        <>
          <div className="text-xs text-ink-400">
            Hiện {exercises.length} / {total} bài tập
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onClick={() => setDetail(ex)} />
            ))}
          </div>
        </>
      ) : (
        <Empty title="Không tìm thấy bài tập" hint="Thử đổi từ khoá." icon={Search} />
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || ''}
        wide
      >
        {detail && <ExerciseDetailContent ex={detail} />}
      </Modal>
    </div>
  );
}

function ExerciseCard({ ex, onClick }) {
  const [svg, setSvg] = useState(null);
  const [svgLoading, setSvgLoading] = useState(true);
  const mapUrl = getLocalMapUrl(ex.id);

  useEffect(() => {
    let cancelled = false;
    fetch(mapUrl)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        // Strip xml declaration + comment
        const cleaned = text
          .replace(/<\?xml[^?]*\?>/g, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim();
        setSvg(cleaned);
        setSvgLoading(false);
      })
      .catch(() => {
        if (!cancelled) setSvgLoading(false);
      });
    return () => { cancelled = true; };
  }, [mapUrl]);

  return (
    <button
      onClick={onClick}
      className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors group"
    >
      {/* SVG preview */}
      <div className="relative bg-ink-950 rounded-lg h-40 flex items-center justify-center overflow-hidden">
        {svgLoading ? (
          <div className="text-xs text-ink-500">Loading...</div>
        ) : svg ? (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{ maxHeight: '160px' }}
            dangerouslySetInnerHTML={{
              __html: svg.replace(
                /<svg([^>]*)>/,
                '<svg$1 style="max-width:100%;max-height:150px;width:auto;height:auto;">'
              ),
            }}
          />
        ) : (
          <div className="text-xs text-ink-500">No preview</div>
        )}
      </div>

      <div className="font-medium text-sm line-clamp-2 min-h-[2.4em] group-hover:text-accent transition-colors">
        {ex.name}
      </div>

      {ex.primaryMuscles?.length > 0 && (
        <div className="text-xs text-accent line-clamp-2 flex items-start gap-1">
          <Activity className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{ex.primaryMuscles.slice(0, 3).join(', ')}</span>
        </div>
      )}
    </button>
  );
}

function ExerciseDetailContent({ ex }) {
  const [svg, setSvg] = useState(null);
  const [svgLoading, setSvgLoading] = useState(true);
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const mapUrl = getLocalMapUrl(ex.id);

  useEffect(() => {
    let cancelled = false;
    fetch(mapUrl)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const cleaned = text
          .replace(/<\?xml[^?]*\?>/g, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim();
        setSvg(cleaned);
        setSvgLoading(false);
      })
      .catch(() => setSvgLoading(false));
    return () => { cancelled = true; };
  }, [mapUrl]);

  // Highlight muscle khi hover vào pill
  const handleMuscleHover = (muscleLabel) => {
    if (!svg) return;
    setHoveredMuscle(muscleLabel);
  };

  return (
    <div className="space-y-4">
      {/* Muscles info */}
      <div className="space-y-3">
        {ex.primaryMuscles?.length > 0 && (
          <div>
            <div className="label">Primary Muscles</div>
            <div className="flex flex-wrap gap-1.5">
              {ex.primaryMuscles.map((m) => (
                <button
                  key={m}
                  className={`chip ${
                    hoveredMuscle === m ? 'border-accent text-accent' : ''
                  }`}
                  onMouseEnter={() => handleMuscleHover(m)}
                  onMouseLeave={() => handleMuscleHover(null)}
                >
                  <Activity className="w-3 h-3" /> {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {ex.secondaryMuscles?.length > 0 && (
          <div>
            <div className="label">Secondary Muscles</div>
            <div className="flex flex-wrap gap-1.5">
              {ex.secondaryMuscles.map((m) => (
                <button
                  key={m}
                  className="chip text-ink-400"
                  onMouseEnter={() => handleMuscleHover(m)}
                  onMouseLeave={() => handleMuscleHover(null)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SVG Diagram — to, nổi bật */}
      <div>
        <div className="label mb-2">Muscle Map</div>
        <div className="bg-ink-950 rounded-xl p-6 flex items-center justify-center min-h-[500px]">
          {svgLoading ? (
            <div className="text-xs text-ink-500 animate-pulse">
              Loading muscle map...
            </div>
          ) : svg ? (
            <div
              className="max-w-full"
              style={{ width: '100%', maxWidth: '500px' }}
              dangerouslySetInnerHTML={{
                __html: svg.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 style="width:100%;height:auto;display:block;">'
                ),
              }}
            />
          ) : (
            <div className="text-xs text-ink-500">No muscle map available</div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {ex.instructions?.length > 0 && (
        <div>
          <div className="label">Instructions</div>
          <ol className="list-decimal ml-5 text-sm text-ink-300 space-y-1">
            {ex.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Video */}
      {ex.videoUrl && (
        <div>
          <a
            href={ex.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost w-full justify-center"
          >
            <Play className="w-4 h-4" /> Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

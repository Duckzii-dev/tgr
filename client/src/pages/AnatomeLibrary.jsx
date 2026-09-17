import { useEffect, useRef, useState } from 'react';
import { Search, Filter, X, Play, Activity, BookOpen, Loader } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useInfiniteExercises } from '../hooks/useInfiniteExercises.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import LazySvg from '../components/LazySvg.jsx';
import { fmtNumber } from '../lib/format.js';
import { svgUrl, fetchSvg } from '../lib/svgUtils.js';

export default function AnatomeLibrary() {
  const [q, setQ] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);

  const facets = useFetch(() => api.get('/anatome/facets'), []);
  const meta = useFetch(() => api.get('/anatome/meta'), []);

  const { items, total, loading, error, hasMore, loadMore } = useInfiniteExercises({
    q,
    muscleSlug,
  });

  const sentinelRef = useRef(null);

  // Infinite scroll với IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

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

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={() => loadMore()}>
            Retry
          </button>
        </div>
      )}

      {items.length === 0 && loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="text-xs text-ink-400">
            Hiện {items.length} / {total} bài tập
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onClick={() => setDetail(ex)} />
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loading ? (
                <div className="flex items-center gap-2 text-ink-400 text-sm">
                  <Loader className="w-4 h-4 animate-spin" /> Đang tải thêm...
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={loadMore}>
                  Load more
                </button>
              )}
            </div>
          )}

          {!hasMore && items.length >= total && total > 50 && (
            <div className="text-center text-xs text-ink-500 py-4">
              Đã hiển thị toàn bộ {total} bài tập
            </div>
          )}
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
  return (
    <button
      onClick={onClick}
      className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors group"
    >
      <div className="relative bg-ink-950 rounded-lg h-40 overflow-hidden">
        <LazySvg exerciseId={ex.id} className="w-full h-full p-2" />
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

  useEffect(() => {
    let cancelled = false;
    fetchSvg(ex.id)
      .then((text) => {
        if (!cancelled) {
          setSvg(text);
          setSvgLoading(false);
        }
      })
      .catch(() => setSvgLoading(false));
    return () => { cancelled = true; };
  }, [ex.id]);

  return (
    <div className="space-y-4">
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
                onMouseEnter={() => setHoveredMuscle(m)}
                onMouseLeave={() => setHoveredMuscle(null)}
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
                onMouseEnter={() => setHoveredMuscle(m)}
                onMouseLeave={() => setHoveredMuscle(null)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="label mb-2">Muscle Map</div>
        <div className="bg-ink-950 rounded-xl p-6 flex items-center justify-center min-h-[500px]">
          {svgLoading ? (
            <div className="text-xs text-ink-500 animate-pulse">Loading...</div>
          ) : svg ? (
            <div
              style={{ width: '100%', maxWidth: '500px' }}
              dangerouslySetInnerHTML={{
                __html: svg.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 style="width:100%;height:auto;display:block;">'
                ),
              }}
            />
          ) : (
            <div className="text-xs text-ink-500">No muscle map</div>
          )}
        </div>
      </div>

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

      {ex.videoUrl && (
        <a
          href={ex.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost w-full justify-center"
        >
          <Play className="w-4 h-4" /> Watch on YouTube
        </a>
      )}
    </div>
  );
}

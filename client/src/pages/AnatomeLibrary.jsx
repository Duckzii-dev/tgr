import { useEffect, useRef, useState } from 'react';
import { Search, X, Play, Activity, BookOpen, Loader, Filter } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import LazySvg from '../components/LazySvg.jsx';
import { fmtNumber } from '../lib/format.js';

const PAGE_SIZE = 50;

const BODY_PARTS = [
  { key: '', label: 'All' },
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'legs', label: 'Legs' },
  { key: 'core', label: 'Core' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'stretch', label: 'Stretch' },
  { key: 'other', label: 'Other' },
];

export default function AnatomeLibrary() {
  const [q, setQ] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [detail, setDetail] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const offsetRef = useRef(0);
  const sentinelRef = useRef(null);

  const meta = useFetch(() => api.get('/anatome/meta'), []);

  // Reset khi filter đổi
  useEffect(() => {
    setItems([]);
    setTotal(0);
    setHasMore(true);
    offsetRef.current = 0;
    setError(null);
  }, [q, bodyPart]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const offset = offsetRef.current;
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (bodyPart) p.set('bodyPart', bodyPart);
    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String(offset));

    try {
      const res = await api.get(`/anatome/exercises?${p}`);
      const list = res.exercises || [];
      const tot = res.total || 0;
      setItems((prev) => (offset === 0 ? list : [...prev, ...list]));
      setTotal(tot);
      offsetRef.current = offset + list.length;
      setHasMore(offset + list.length < tot);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (offsetRef.current === 0 && items.length === 0) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, bodyPart]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
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
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Tìm bài tập (bench, squat, curl...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BODY_PARTS.map((bp) => (
            <button
              key={bp.key}
              className={`chip ${bodyPart === bp.key ? 'border-accent text-accent' : ''}`}
              onClick={() => setBodyPart(bp.key)}
            >
              {bp.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={loadMore}>Retry</button>
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
              <button
                key={ex.id}
                onClick={() => setDetail(ex)}
                className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors group"
              >
                <div className="relative bg-ink-950 rounded-lg h-40 overflow-hidden">
                  <LazySvg exerciseId={ex.id} className="w-full h-full p-2" />
                </div>

                <div className="font-medium text-sm line-clamp-2 min-h-[2.4em] group-hover:text-accent transition-colors">
                  {ex.name}
                </div>

                <div className="flex flex-wrap gap-1">
                  {ex.bodyPart && (
                    <span className="chip text-[10px] capitalize">{ex.bodyPart}</span>
                  )}
                </div>

                {ex.primaryMuscles?.length > 0 && (
                  <div className="text-xs text-accent line-clamp-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span>{ex.primaryMuscles.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loading ? (
                <div className="flex items-center gap-2 text-ink-400 text-sm">
                  <Loader className="w-4 h-4 animate-spin" /> Đang tải...
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={loadMore}>Load more</button>
              )}
            </div>
          )}

          {!hasMore && items.length >= total && total > PAGE_SIZE && (
            <div className="text-center text-xs text-ink-500 py-4">
              Đã hiển thị toàn bộ {total} bài tập
            </div>
          )}
        </>
      ) : (
        <Empty title="Không có bài tập" hint="Thử đổi filter." icon={Search} />
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

function ExerciseDetailContent({ ex }) {
  const [svg, setSvg] = useState(null);
  const [svgLoading, setSvgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const slug = String(ex.id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
    fetch(`/static/muscle-maps/${slug}.svg`)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const cleaned = text
          .replace(/<\?xml[^?]*\?>/g, '')
          .replace(/<--- 38.46.226.72 ping statistics[\s\S]*?-->/g, '')
          .trim();
        setSvg(cleaned);
        setSvgLoading(false);
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
              <span key={m} className="chip border-accent text-accent">
                <Activity className="w-3 h-3" /> {m}
              </span>
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

      {ex.svgPath && (
        <a
          href={ex.svgPath}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost w-full justify-center"
        >
          Open SVG in new tab
        </a>
      )}
    </div>
  );
}

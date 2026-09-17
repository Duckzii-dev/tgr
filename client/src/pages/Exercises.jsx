import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, Activity, Loader, BookOpen, Check } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import LazySvg from '../components/LazySvg.jsx';
import { useToast } from '../lib/toast.jsx';
import CustomExerciseModal from '../components/CustomExerciseModal.jsx';
import { fmtNumber } from '../lib/format.js';

const PAGE_SIZE = 50;

const SOURCE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom' },
];

const MUSCLE_FILTERS = [
  '', 'traps', 'lats', 'middle-back', 'lower-back',
  'front-delts', 'side-delts', 'rear-delts',
  'upper-chest', 'chest',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'glutes', 'quadriceps', 'hamstrings', 'calves',
];

const MUSCLE_OPTIONS = [
  // Chest
  { group: 'chest', label: 'Chest', slugs: ['chest', 'upper-chest'] },
  // Back
  { group: 'back', label: 'Back', slugs: ['lats', 'middle-back', 'lower-back', 'traps'] },
  // Shoulders
  { group: 'shoulders', label: 'Shoulders', slugs: ['front-delts', 'side-delts', 'rear-delts'] },
  // Arms
  { group: 'biceps', label: 'Biceps', slugs: ['biceps'] },
  { group: 'triceps', label: 'Triceps', slugs: ['triceps'] },
  { group: 'forearms', label: 'Forearms', slugs: ['forearms'] },
  // Legs
  { group: 'legs', label: 'Legs', slugs: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
  // Core
  { group: 'core', label: 'Core', slugs: ['abs', 'obliques'] },
  // Cardio
  { group: 'cardio', label: 'Cardio', slugs: ['cardio'] },
];

export default function Exercises() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);

  const offsetRef = useRef(0);
  const sentinelRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadPage = useCallback(async (reset) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const offset = reset ? 0 : offsetRef.current;
    const p = new URLSearchParams();
    if (debouncedQ) p.set('q', debouncedQ);
    if (muscleSlug) p.set('muscleSlug', muscleSlug);
    if (tab !== 'all') p.set('source', tab);
    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String(offset));

    try {
      const res = await api.get(`/exercises?${p}`);
      if (reqId !== requestIdRef.current) return;

      const list = res.exercises || [];
      const tot = res.total || 0;

      if (reset) {
        setItems(list);
        offsetRef.current = list.length;
      } else {
        setItems((prev) => [...prev, ...list]);
        offsetRef.current = offset + list.length;
      }
      setTotal(tot);
      setHasMore((offset + list.length) < tot);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      setError(e.message);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedQ, muscleSlug, tab]);

  useEffect(() => {
    setItems([]);
    setTotal(0);
    setHasMore(true);
    offsetRef.current = 0;
    setError(null);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, muscleSlug, tab]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadPage(false); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadPage]);

  const onCardClick = (ex) => {
    navigate(`/exercises/${encodeURIComponent(ex.id)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-2xl font-semibold">Exercise Library</h1>
            <p className="text-sm text-ink-400 mt-0.5">
              {fmtNumber(total)} bài tập
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Custom
        </button>
      </div>

      <div className="flex gap-1 border-b border-ink-700 overflow-x-auto">
        {SOURCE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm whitespace-nowrap ${
              tab === t.key
                ? 'text-accent border-b-2 border-accent'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Tìm bài tập..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="space-y-2 pt-2 border-t border-ink-700">
          <div className="text-[10px] uppercase tracking-wide text-ink-500">
            Muscle
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              className={`chip text-[10px] ${muscleSlug === '' ? 'border-accent text-accent' : ''}`}
              onClick={() => setMuscleSlug('')}
            >
              All
            </button>
            {MUSCLE_FILTERS.filter(Boolean).map((slug) => (
              <button
                key={slug}
                className={`chip text-[10px] capitalize ${muscleSlug === slug ? 'border-accent text-accent' : ''}`}
                onClick={() => setMuscleSlug(muscleSlug === slug ? '' : slug)}
              >
                {slug.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {(muscleSlug || debouncedQ) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-ink-700">
            <div className="text-ink-400">
              {muscleSlug && <span className="text-accent capitalize">{muscleSlug}</span>}
              {debouncedQ && <span className="ml-2">· "{debouncedQ}"</span>}
              <span className="ml-2">→ {total} kết quả</span>
            </div>
            <button
              className="text-ink-400 hover:text-white flex items-center gap-1"
              onClick={() => { setMuscleSlug(''); setQ(''); }}
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={() => loadPage(true)}>
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
              <button
                key={ex.id}
                onClick={() => onCardClick(ex)}
                className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors group"
              >
                <div className="relative bg-ink-950 rounded-lg h-40 overflow-hidden">
                  {ex.hasSvg ? (
                    <LazySvg exerciseId={ex.svgId || ex.id} className="w-full h-full p-2" />
                  ) : ex.videoUrl ? (
                    <video src={ex.videoUrl} muted loop playsInline preload="metadata"
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-500">
                      No media
                    </div>
                  )}
                </div>

                <div className="font-medium text-sm line-clamp-2 min-h-[2.4em] group-hover:text-accent transition-colors">
                  {ex.name}
                </div>

                <div className="flex flex-wrap gap-1">
                  {ex.source && (
                    <span className="chip text-[10px] capitalize">{ex.source}</span>
                  )}
                  {ex.bodyPart && (
                    <span className="chip text-[10px] capitalize">{ex.bodyPart}</span>
                  )}
                  {ex.muscleSlugs?.slice(0, 3).map((slug) => (
                    <span key={slug} className="chip text-[10px] capitalize border-accent/40">
                      {slug.replace(/-/g, ' ')}
                    </span>
                  ))}
                  {ex.isCustom && (
                    <span className="chip text-[10px] border-accent text-accent">custom</span>
                  )}
                </div>
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
                <button className="btn btn-ghost" onClick={() => loadPage(false)}>
                  Load more
                </button>
              )}
            </div>
          )}

          {!hasMore && items.length >= total && total > PAGE_SIZE && (
            <div className="text-center text-xs text-ink-500 py-4">
              Đã hiển thị toàn bộ {total} bài tập
            </div>
          )}
        </>
      ) : !loading ? (
        <Empty
          title="Không có bài tập"
          hint={muscleSlug || debouncedQ ? 'Không có kết quả.' : 'Chưa có dữ liệu.'}
          icon={Search}
        />
      ) : null}

      <CustomExerciseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setTab('custom');
          loadPage(true);
        }}
      />
    </div>
  );
}

// ============================================================
// Custom exercise modal — chọn nhiều muscle slugs
// ============================================================

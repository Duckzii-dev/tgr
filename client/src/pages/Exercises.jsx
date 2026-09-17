import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, Play, Activity, Loader, BookOpen } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import LazySvg from '../components/LazySvg.jsx';
import { useToast } from '../lib/toast.jsx';
import { fmtNumber } from '../lib/format.js';

const PAGE_SIZE = 50;

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'db', label: 'Database' },
  { key: 'anatome', label: 'Anatome (879)' },
  { key: 'video', label: 'With Video' },
  { key: 'custom', label: 'Custom' },
];

export default function Exercises() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', muscleGroup: 'chest', equipment: '' });

  const offsetRef = useRef(0);
  const sentinelRef = useRef(null);

  const facets = useFetch(() => api.get('/exercises/facets'), []);

  // Reset khi filter/tab đổi
  useEffect(() => {
    setItems([]);
    setTotal(0);
    setHasMore(true);
    offsetRef.current = 0;
  }, [tab, q, muscleSlug]);

  // Load
  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    const offset = offsetRef.current;
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (muscleSlug) p.set('muscleSlug', muscleSlug);
    p.set('source', tab === 'all' ? '' : tab);
    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String(offset));

    try {
      const res = await api.get(`/exercises?${p}`);
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
  }, [tab, q, muscleSlug]);

  // Infinite scroll
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

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exercises', form);
      toast('Exercise created');
      setCreateOpen(false);
      setForm({ name: '', muscleGroup: 'chest', equipment: '' });
      // Reload tab custom
      setTab('custom');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const onCardClick = (ex) => {
    if (ex.source === 'anatome') {
      navigate(`/exercises/anatome:${ex.svgId}`);
    } else {
      navigate(`/exercises/${ex.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-2xl font-semibold">Exercise Library</h1>
            <p className="text-sm text-ink-400 mt-0.5">
              Hợp nhất: DB + Anatome 879 bài
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Custom
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-700 overflow-x-auto">
        {TABS.map((t) => (
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

      {/* Search + filter */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Tìm bài tập..."
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
            <div className="flex flex-wrap gap-1.5">
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
                onClick={() => onCardClick(ex)}
                className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors group"
              >
                <div className="relative bg-ink-950 rounded-lg h-40 overflow-hidden">
                  {ex.hasSvg ? (
                    <LazySvg exerciseId={ex.svgId} className="w-full h-full p-2" />
                  ) : ex.videoUrl ? (
                    <video
                      src={ex.videoUrl}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-500">
                      No media
                    </div>
                  )}
                </div>

                <div className="font-medium text-sm line-clamp-2 min-h-[2.4em] group-hover:text-accent transition-colors">
                  {ex.name}
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <span className="chip text-[10px] capitalize">{ex.source}</span>
                  {ex.muscleGroup && (
                    <span className="chip text-[10px] capitalize">{ex.muscleGroup}</span>
                  )}
                  {ex.isCustom && (
                    <span className="chip text-[10px] border-accent text-accent">custom</span>
                  )}
                </div>

                {ex.primaryMuscles?.length > 0 && (
                  <div className="text-xs text-accent line-clamp-2 flex items-start gap-1">
                    <Activity className="w-3 h-3 shrink-0 mt-0.5" />
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
        <Empty title="Không có bài tập" hint="Thử đổi filter hoặc tab." icon={Search} />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Custom Exercise">
        <form onSubmit={submitCreate} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Muscle Group</label>
            <select
              className="input"
              value={form.muscleGroup}
              onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
            >
              <option value="chest">chest</option>
              <option value="back">back</option>
              <option value="shoulders">shoulders</option>
              <option value="biceps">biceps</option>
              <option value="triceps">triceps</option>
              <option value="legs">legs</option>
              <option value="core">core</option>
              <option value="cardio">cardio</option>
            </select>
          </div>
          <div>
            <label className="label">Equipment</label>
            <input
              className="input"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            />
          </div>
          <button className="btn btn-primary w-full justify-center">Create</button>
        </form>
      </Modal>
    </div>
  );
}

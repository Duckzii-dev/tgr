import { useState } from 'react';
import { Search, Filter, X, Play, Activity } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import { fmtNumber } from '../lib/format.js';

const API_ANATOME = 'https://api.anatome.dev';

function buildAnatomeUrl(ex) {
  if (!ex?.layersPayload?.length) return null;
  const layers = ex.layersPayload
    .map((l) => {
      const color = (l.color || '#DC2626').replace('#', '');
      const muscles = (l.muscles || []).join('%2C');
      return `${color}:${muscles}`;
    })
    .join(',');
  return `${API_ANATOME}/generateImage?gender=male&view=dual&layers=${layers}&output=raw`;
}

export default function AnatomeLibrary() {
  const [q, setQ] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);

  const facets = useFetch(() => api.get('/anatome/facets'), []);
  const meta = useFetch(() => api.get('/anatome/meta'), []);

  const { data, loading } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (bodyPart) p.set('bodyPart', bodyPart);
      if (equipment) p.set('equipment', equipment);
      if (difficulty) p.set('difficulty', difficulty);
      if (muscleSlug) p.set('muscleSlug', muscleSlug);
      if (category) p.set('category', category);
      p.set('limit', '100');
      return api.get(`/anatome/exercises?${p}`);
    },
    [q, bodyPart, equipment, difficulty, muscleSlug, category]
  );

  const exercises = data?.exercises || [];
  const total = data?.total || 0;
  const hasFilters = bodyPart || equipment || difficulty || muscleSlug || category;

  const clearFilters = () => {
    setBodyPart('');
    setEquipment('');
    setDifficulty('');
    setMuscleSlug('');
    setCategory('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Exercise Library</h1>
        <p className="text-sm text-ink-400 mt-1">
          {fmtNumber(meta.data?.total) || '...'} bài tập từ Anatome DB · Apache-2.0
        </p>
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
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-ink-700">
            <div>
              <label className="label">Body Part</label>
              <select className="input" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.bodyParts || []).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Equipment</label>
              <select className="input" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.equipments || []).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.difficulties || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.categories || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="label">Muscle</label>
              <select className="input" value={muscleSlug} onChange={(e) => setMuscleSlug(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.muscleSlugs || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                className="btn btn-ghost text-xs col-span-2 md:col-span-4 justify-center"
                onClick={clearFilters}
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : exercises.length ? (
        <>
          <div className="text-xs text-ink-400">
            Hiện {exercises.length} / {total} bài tập
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setDetail(ex)}
                className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors"
              >
                <div className="font-medium text-sm line-clamp-2 min-h-[2.4em]">
                  {ex.name}
                </div>

                {ex.primaryMuscles?.length > 0 && (
                  <div className="text-xs text-accent line-clamp-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span>{ex.primaryMuscles.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {ex.equipment && (
                    <span className="chip text-[10px]">{ex.equipment}</span>
                  )}
                  {ex.difficulty && (
                    <span className="chip text-[10px]">{ex.difficulty}</span>
                  )}
                  {ex.mechanic && (
                    <span className="chip text-[10px]">{ex.mechanic}</span>
                  )}
                </div>

                {ex.videoUrl && (
                  <div className="text-[10px] text-ink-500 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Video
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Empty title="Không tìm thấy bài tập" hint="Thử đổi từ khoá hoặc filter." />
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
  const anatomeUrl = buildAnatomeUrl(ex);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ex.equipment && <span className="chip">{ex.equipment}</span>}
        {ex.difficulty && <span className="chip">{ex.difficulty}</span>}
        {ex.category && <span className="chip">{ex.category}</span>}
        {ex.mechanic && <span className="chip">{ex.mechanic}</span>}
        {ex.force && <span className="chip">{ex.force}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ex.primaryMuscles?.length > 0 && (
          <div>
            <div className="label">Primary Muscles</div>
            <div className="text-sm text-accent">
              {ex.primaryMuscles.join(', ')}
            </div>
          </div>
        )}
        {ex.secondaryMuscles?.length > 0 && (
          <div>
            <div className="label">Secondary</div>
            <div className="text-sm text-ink-300">
              {ex.secondaryMuscles.join(', ')}
            </div>
          </div>
        )}
      </div>

      {anatomeUrl && (
        <div>
          <button
            className="btn btn-ghost w-full justify-center"
            onClick={() => setShowMap((v) => !v)}
          >
            <Activity className="w-4 h-4" />
            {showMap ? 'Hide' : 'Show'} Muscle Map
          </button>
          {showMap && (
            <div className="mt-3 flex justify-center bg-ink-950 rounded-xl p-4 min-h-[420px]">
              {mapError ? (
                <div className="text-xs text-red-400 self-center">
                  Muscle map unavailable (Anatome API offline)
                </div>
              ) : (
                <img
                  src={anatomeUrl}
                  alt="Muscle map"
                  width={280}
                  height={420}
                  className="max-w-full"
                  onError={() => setMapError(true)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {ex.videoUrl && (
        <div>
          <div className="label">Video</div>
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

      {ex.keywords?.length > 0 && (
        <div>
          <div className="label">Keywords</div>
          <div className="flex flex-wrap gap-1">
            {ex.keywords.slice(0, 20).map((k, i) => (
              <span key={i} className="chip text-[10px]">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

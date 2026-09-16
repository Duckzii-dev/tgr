cat > ~/Code/tgr/client/src/pages/ImportExercises.jsx <<'ENDOFFILE'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';

const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio'];

export default function ImportExercises() {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('');

  const { data, loading } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (muscle) p.set('muscleGroup', muscle);
      p.set('limit', '60');
      return api.get(`/exercises?${p}`);
    },
    [q, muscle]
  );

  const exercises = data?.exercises || [];
  const total = data?.total || exercises.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Exercise Library</h1>
        <p className="text-sm text-ink-400 mt-1">
          {total} bài tập · có video demo
        </p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Tìm bài tập..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
        >
          <option value="">Tất cả nhóm cơ</option>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : exercises.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              to={`/exercises/${ex.id}`}
              className="card overflow-hidden hover:border-accent/50 transition-colors group"
            >
              <div className="aspect-video bg-ink-800 relative">
                {ex.videoUrl ? (
                  <video
                    src={ex.videoUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                    onMouseLeave={(e) => {
                      e.target.pause();
                      e.target.currentTime = 0;
                    }}
                  />
                ) : ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-500 text-xs">
                    No media
                  </div>
                )}
                {ex.videoUrl && (
                  <div className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium text-sm truncate">{ex.name}</div>
                <div className="text-xs text-ink-400 capitalize truncate">
                  {ex.muscleGroup} · {ex.equipment || '—'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="Không có bài tập" hint="Thử đổi từ khoá tìm kiếm." />
      )}
    </div>
  );
}
ENDOFFILE
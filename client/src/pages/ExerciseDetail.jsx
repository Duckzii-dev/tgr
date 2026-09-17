import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Activity, BookOpen } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import StrengthLevelCard from '../components/StrengthLevelCard.jsx';
import { fmtDate, fmtNumber } from '../lib/format.js';

const TABS = ['Overview', 'History', 'Progression', 'Intensity', 'PRs'];
const RANGES = { '30D': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 99999 };

export default function ExerciseDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState('3M');
  const { data, loading, error, refresh } = useFetch(
    () => api.get(`/exercises/${encodeURIComponent(id)}`),
    [id]
  );

  const progression = useMemo(() => {
    if (!data?.sessions) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGES[range]);
    const byDay = new Map();
    for (const sess of data.sessions) {
      if (new Date(sess.date) < cutoff) continue;
      const k = new Date(sess.date).toISOString().slice(0, 10);
      if (!byDay.has(k))
        byDay.set(k, { date: k, maxWeight: 0, volume: 0, reps: 0, estimated1RM: 0 });
      const d = byDay.get(k);
      for (const s of sess.sets) {
        if (s.weight > d.maxWeight) d.maxWeight = s.weight;
        d.volume += s.weight * s.reps;
        d.reps += s.reps;
        if (s.estimated1RM && s.estimated1RM > d.estimated1RM)
          d.estimated1RM = s.estimated1RM;
      }
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data, range]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="card p-4 text-red-400 text-sm">
        {error}{' '}
        <button className="underline ml-2" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }
  if (!data?.exercise) return <Empty title="Exercise not found" />;

  const { exercise, stats, prs = [], sessions = [], muscleContributions } = data;

  // === Anatome exercise (không có stats) ===
  if (!stats) {
    return <AnatomeExerciseDetail exercise={exercise} />;
  }

  // === DB exercise (có stats đầy đủ) ===
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h1 className="text-2xl font-semibold">{exercise.name}</h1>
        <div className="text-sm text-ink-400 capitalize">
          {exercise.muscleGroup} · {exercise.equipment || '—'}
          {exercise.exerciseType ? ` · ${exercise.exerciseType}` : ''}
        </div>
        {exercise.overview && (
          <p className="text-sm text-ink-300 mt-3">{exercise.overview}</p>
        )}
      </div>

      {muscleContributions && muscleContributions.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-3">Muscles Worked</div>
          <div className="space-y-2">
            {muscleContributions.map((c) => (
              <div key={c.muscleGroup}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{c.label}</span>
                  <span className="text-ink-400">{Math.round(c.weight * 100)}%</span>
                </div>
                <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.weight * 100}%`,
                      background: '#c6ff3d',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StrengthLevelCard exerciseId={exercise.id} />

      {exercise.videoUrl && (
        <div className="card p-0 overflow-hidden">
          <video
            src={exercise.videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-h-[600px] bg-black"
          />
        </div>
      )}

      {!exercise.videoUrl && exercise.imageUrl && (
        <div className="card p-0 overflow-hidden">
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="w-full max-h-[500px] object-cover bg-ink-800"
          />
        </div>
      )}

      {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Cách thực hiện</div>
          <ol className="list-decimal ml-5 text-sm text-ink-300 space-y-1">
            {exercise.instructions.map((s, i) => (<li key={i}>{s}</li>))}
          </ol>
        </div>
      )}

      {Array.isArray(exercise.exerciseTips) && exercise.exerciseTips.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Tips</div>
          <ul className="list-disc ml-5 text-sm text-ink-300 space-y-1">
            {exercise.exerciseTips.map((s, i) => (<li key={i}>{s}</li>))}
          </ul>
        </div>
      )}

      {Array.isArray(exercise.variations) && exercise.variations.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Biến thể</div>
          <ul className="list-disc ml-5 text-sm text-ink-300 space-y-1">
            {exercise.variations.map((s, i) => (<li key={i}>{s}</li>))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Current Best" value={`${stats.currentBest}kg`} />
        <StatCard label="Starting" value={`${stats.startingWeight}kg`} />
        <StatCard label="Best 1RM (est)" value={`${fmtNumber(stats.best1RM, 1)}kg`} />
        <StatCard label="Best 5 reps" value={`${stats.best5}kg`} />
        <StatCard label="Best 10 reps" value={`${stats.best10}kg`} />
        <StatCard label="Total Sets" value={stats.totalSets} />
        <StatCard label="Total Reps" value={fmtNumber(stats.totalReps)} />
        <StatCard label="Sessions" value={stats.totalSessions} />
      </div>

      <div className="flex gap-1 border-b border-ink-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm whitespace-nowrap ${
              tab === t
                ? 'text-accent border-b-2 border-accent'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {Object.keys(RANGES).map((r) => (
              <button
                key={r}
                className={`chip ${range === r ? 'border-accent text-accent' : ''}`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Weight over time</div>
              <LineChartCard data={progression} lines={[{ key: 'maxWeight', name: 'kg' }]} />
            </div>
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Estimated 1RM over time</div>
              <LineChartCard
                data={progression}
                lines={[{ key: 'estimated1RM', name: '1RM', color: '#ffb038' }]}
              />
            </div>
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Volume over time</div>
              <LineChartCard
                data={progression}
                lines={[{ key: 'volume', name: 'kg', color: '#5ed3ff' }]}
              />
            </div>
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Reps over time</div>
              <LineChartCard
                data={progression}
                lines={[{ key: 'reps', name: 'reps', color: '#b494ff' }]}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'History' &&
        (sessions.length ? (
          <div className="space-y-2">
            {[...sessions].reverse().map((s) => (
              <div key={s.workoutId} className="card p-4">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-ink-400">{fmtDate(s.date)}</div>
                </div>
                <div className="text-xs text-ink-300 space-y-0.5">
                  {s.sets.map((set, i) => (
                    <div key={set.id}>
                      {i + 1}. {set.weight}kg × {set.reps}
                      {set.rir != null ? ` (RIR ${set.rir})` : ''}
                      {set.rpe != null ? ` (RPE ${set.rpe})` : ''}
                      {set.estimated1RM ? ` · ${set.estimated1RM.toFixed(1)} 1RM` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No history yet" />
        ))}

      {tab === 'Progression' && (
        <div className="card p-4">
          <div className="text-sm mb-2 text-ink-300">Weight progression</div>
          <LineChartCard data={progression} lines={[{ key: 'maxWeight', name: 'kg' }]} height={320} />
        </div>
      )}

      {tab === 'Intensity' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Avg RIR"
              value={stats.avgRir != null ? stats.avgRir.toFixed(2) : '—'}
              sub="Lower = closer to failure"
            />
            <StatCard
              label="Avg RPE"
              value={stats.avgRpe != null ? stats.avgRpe.toFixed(2) : '—'}
              sub="10 = max effort"
            />
          </div>
          {stats.rpeProgression?.length > 0 ? (
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">RIR / RPE over time</div>
              <LineChartCard
                data={stats.rpeProgression}
                xKey="date"
                lines={[
                  { key: 'avgRir', name: 'RIR', color: '#c6ff3d' },
                  { key: 'avgRpe', name: 'RPE', color: '#5ed3ff' },
                ]}
                height={320}
              />
            </div>
          ) : (
            <Empty title="No RIR/RPE data" hint="Log RIR or RPE in sets to see trend." />
          )}
          {Object.keys(stats.rirDistribution || {}).length > 0 && (
            <div className="card p-4">
              <div className="font-semibold mb-3">RIR Distribution</div>
              <div className="space-y-2">
                {Object.entries(stats.rirDistribution)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([rir, count]) => {
                    const max = Math.max(...Object.values(stats.rirDistribution));
                    return (
                      <div key={rir}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>RIR {rir}{rir === '0' && ' (failure)'}</span>
                          <span className="text-ink-400">{count} sets</span>
                        </div>
                        <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'PRs' &&
        (prs.length ? (
          <div className="space-y-2">
            {prs.map((p) => (
              <div key={p.id} className="card p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm capitalize">{p.type.replace('_', ' ')}</div>
                  <div className="text-xs text-ink-400">
                    {fmtDate(p.achievedAt)}
                    {p.reps ? ` · ${p.weight}kg × ${p.reps}` : ''}
                  </div>
                </div>
                <div className="text-accent font-semibold">{fmtNumber(p.value, 1)}</div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No PRs yet" />
        ))}
    </div>
  );
}

// ============================================================
// Anatome exercise detail — không có stats
// ============================================================
function AnatomeExerciseDetail({ exercise }) {
  const [svg, setSvg] = useState(null);
  const [svgLoading, setSvgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const slug = String(exercise.id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
    fetch(`/static/muscle-maps/${slug}.svg`)
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
  }, [exercise.id]);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h1 className="text-2xl font-semibold">{exercise.name}</h1>
        <div className="text-sm text-ink-400 capitalize">
          {exercise.bodyPart && <span>{exercise.bodyPart}</span>}
          {exercise.equipment && <span> · {exercise.equipment}</span>}
          <span className="ml-2 chip text-[10px]">Anatome</span>
        </div>
      </div>

      {exercise.muscleSlugs?.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-3">Muscles Worked</div>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleSlugs.map((slug) => (
              <span key={slug} className="chip border-accent text-accent capitalize">
                <Activity className="w-3 h-3" />
                {slug.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="font-semibold mb-3">Muscle Map</div>
        <div className="bg-ink-950 rounded-xl p-6 flex items-center justify-center min-h-[500px]">
          {svgLoading ? (
            <div className="text-xs text-ink-500 animate-pulse">Loading muscle map...</div>
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
            <div className="text-xs text-ink-500">No muscle map available</div>
          )}
        </div>
      </div>

      {exercise.instructions?.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Cách thực hiện</div>
          <ol className="list-decimal ml-5 text-sm text-ink-300 space-y-1">
            {exercise.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="card p-4">
        <div className="text-sm text-ink-400 text-center">
          Đây là bài tập từ Anatome library. Log workout để theo dõi tiến độ.
        </div>
      </div>
    </div>
  );
}

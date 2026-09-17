import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Activity, ArrowLeft, Info, Edit3, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import StrengthLevelCard from '../components/StrengthLevelCard.jsx';
import { fmtDate, fmtNumber } from '../lib/format.js';
import CustomExerciseModal from '../components/CustomExerciseModal.jsx';
import { useAuth } from '../lib/auth.jsx';

const TABS = ['Overview', 'History', 'Progression', 'Intensity', 'PRs'];
const RANGES = { '30D': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 99999 };

export default function ExerciseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState('3M');
  const [editOpen, setEditOpen] = useState(false);

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
  const isAnatome = exercise.source === 'anatome' || exercise.id?.startsWith('anatome:') || !stats;

  // Tính `displayStats` — nếu không có stats thật thì dùng empty
  const displayStats = stats || {
    currentBest: 0,
    startingWeight: 0,
    best1RM: 0,
    best5: 0,
    best10: 0,
    totalSets: 0,
    totalReps: 0,
    totalSessions: 0,
    totalVolume: 0,
    maxWeight: 0,
    avgRir: null,
    avgRpe: null,
    rirDistribution: {},
    rpeProgression: [],
  };

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link to="/exercises" className="btn btn-ghost inline-flex">
        <ArrowLeft className="w-4 h-4" /> Exercises
      </Link>

      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold">{exercise.name}</h1>
            <div className="text-sm text-ink-400 capitalize">
              {exercise.muscleGroup || exercise.bodyPart || '—'}
              {exercise.equipment && <span> · {exercise.equipment}</span>}
              {isAnatome && (
                <span className="ml-2 chip text-[10px] border-accent/40">
                  Anatome
                </span>
              )}
              {exercise.isCustom && (
                <span className="ml-2 chip text-[10px] border-accent text-accent">
                  Custom
                </span>
              )}
            </div>
            {exercise.muscleSlugs?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {exercise.muscleSlugs.map((slug) => (
                  <span key={slug} className="chip text-[10px] capitalize border-accent/40">
                    {slug.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            {exercise.overview && (
              <p className="text-sm text-ink-300 mt-3">{exercise.overview}</p>
            )}
          </div>
          {exercise.isCustom && (
            <button
              className="btn btn-ghost shrink-0"
              onClick={() => setEditOpen(true)}
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Muscle contributions (DB exercises) */}
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
                    style={{ width: `${c.weight * 100}%`, background: '#c6ff3d' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Muscle slugs (Anatome exercises) */}
      {isAnatome && exercise.muscleSlugs?.length > 0 && (
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

      {/* Strength Level (chỉ DB có) */}
      {!isAnatome && <StrengthLevelCard exerciseId={exercise.id} />}

      {/* Muscle Map — cho cả Anatome và DB có media */}
      {isAnatome && <MuscleMapSection exercise={exercise} />}

      {/* Video */}
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

      {/* Image (DB, non-video) */}
      {!isAnatome && !exercise.videoUrl && exercise.imageUrl && (
        <div className="card p-0 overflow-hidden">
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="w-full max-h-[500px] object-cover bg-ink-800"
          />
        </div>
      )}

      {/* Instructions */}
      {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Cách thực hiện</div>
          <ol className="list-decimal ml-5 text-sm text-ink-300 space-y-1">
            {exercise.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Tips (DB) */}
      {Array.isArray(exercise.exerciseTips) && exercise.exerciseTips.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Tips</div>
          <ul className="list-disc ml-5 text-sm text-ink-300 space-y-1">
            {exercise.exerciseTips.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Variations (DB) */}
      {Array.isArray(exercise.variations) && exercise.variations.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Biến thể</div>
          <ul className="list-disc ml-5 text-sm text-ink-300 space-y-1">
            {exercise.variations.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notice for Anatome without data */}
      {isAnatome && displayStats.totalSets === 0 && (
        <div className="card p-4 border-accent/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-sm text-ink-300">
              <strong className="text-white">Chưa có dữ liệu tập luyện.</strong>
              <br />
              Log bài tập này trong buổi tập để theo dõi tiến độ, PR, RIR/RPE và các chỉ số khác.
            </div>
          </div>
        </div>
      )}

      {/* Stats — luôn hiển thị, dùng 0 nếu chưa có */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Current Best" value={`${displayStats.currentBest || 0}kg`} />
        <StatCard label="Starting" value={`${displayStats.startingWeight || 0}kg`} />
        <StatCard
          label="Best 1RM (est)"
          value={`${fmtNumber(displayStats.best1RM, 1)}kg`}
        />
        <StatCard label="Best 5 reps" value={`${displayStats.best5 || 0}kg`} />
        <StatCard label="Best 10 reps" value={`${displayStats.best10 || 0}kg`} />
        <StatCard label="Total Sets" value={displayStats.totalSets || 0} />
        <StatCard label="Total Reps" value={fmtNumber(displayStats.totalReps || 0)} />
        <StatCard label="Sessions" value={displayStats.totalSessions || 0} />
      </div>

      {/* Tabs */}
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

      {/* Tab: Overview */}
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
          {progression.length > 0 ? (
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
          ) : (
            <Empty title="Chưa có dữ liệu" hint="Log workout để xem biểu đồ." />
          )}
        </div>
      )}

      {/* Tab: History */}
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
          <Empty title="Chưa có lịch sử" hint="Log workout để bắt đầu." />
        ))}

      {/* Tab: Progression */}
      {tab === 'Progression' && (
        progression.length > 0 ? (
          <div className="card p-4">
            <div className="text-sm mb-2 text-ink-300">Weight progression</div>
            <LineChartCard
              data={progression}
              lines={[{ key: 'maxWeight', name: 'kg' }]}
              height={320}
            />
          </div>
        ) : (
          <Empty title="Chưa có dữ liệu" />
        )
      )}

      {/* Tab: Intensity */}
      {tab === 'Intensity' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Avg RIR"
              value={displayStats.avgRir != null ? displayStats.avgRir.toFixed(2) : '—'}
              sub="Lower = closer to failure"
            />
            <StatCard
              label="Avg RPE"
              value={displayStats.avgRpe != null ? displayStats.avgRpe.toFixed(2) : '—'}
              sub="10 = max effort"
            />
          </div>
          {displayStats.rpeProgression?.length > 0 ? (
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">RIR / RPE over time</div>
              <LineChartCard
                data={displayStats.rpeProgression}
                xKey="date"
                lines={[
                  { key: 'avgRir', name: 'RIR', color: '#c6ff3d' },
                  { key: 'avgRpe', name: 'RPE', color: '#5ed3ff' },
                ]}
                height={320}
              />
            </div>
          ) : (
            <Empty title="Chưa có RIR/RPE" hint="Log RIR hoặc RPE trong sets." />
          )}
          {Object.keys(displayStats.rirDistribution || {}).length > 0 && (
            <div className="card p-4">
              <div className="font-semibold mb-3">RIR Distribution</div>
              <div className="space-y-2">
                {Object.entries(displayStats.rirDistribution)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([rir, count]) => {
                    const max = Math.max(...Object.values(displayStats.rirDistribution));
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

      {/* Tab: PRs */}
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
          <Empty title="Chưa có PR" hint="Log workout để phá kỷ lục." />
        ))}
    </div>
  );
}

function MuscleMapSection({ exercise }) {
  const [svg, setSvg] = useState(null);
  const [svgLoading, setSvgLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const rawId = exercise.svgId || String(exercise.id).replace(/^anatome:/, '');
    const slug = rawId.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
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
        setSvg(cleaned);
        setSvgLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setSvgLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [exercise.id, exercise.svgId]);

  return (
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
  );
}

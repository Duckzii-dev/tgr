import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';

const STATUS_COLORS = {
  completed: 'bg-accent/20 text-accent border-accent/40',
  missed: 'bg-red-500/15 text-red-400 border-red-500/30',
  rest: 'bg-ink-800 text-ink-400 border-ink-700',
  unplanned: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const STATUS_LABEL = {
  completed: 'Completed',
  missed: 'Missed',
  rest: 'Rest',
  unplanned: 'Unplanned',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const navigate = useNavigate();

  const { data, loading, error, refresh } = useFetch(
    () => api.get(`/calendar?year=${year}&month=${month}`),
    [year, month]
  );

  const grid = useMemo(() => {
    if (!data?.days) return [];
    const first = new Date(data.days[0].date);
    const pad = first.getDay();
    const padded = [...Array(pad).fill(null), ...data.days];
    while (padded.length % 7) padded.push(null);
    const rows = [];
    for (let i = 0; i < padded.length; i += 7) rows.push(padded.slice(i, i + 7));
    return rows;
  }, [data]);

  const prev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else setMonth(month + 1);
  };

  const monthName = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const handleDayClick = (day) => {
    const hasWorkout = day.workouts.length > 0;
    if (hasWorkout) {
      navigate(`/workouts/${day.workouts[0].id}`);
    } else {
      const isFuture = day.date > todayISO();
      if (isFuture) return;
      navigate(`/workouts/new?date=${day.date}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={prev}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium w-40 text-center">{monthName}</div>
          <button className="btn btn-ghost" onClick={next}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <span key={k} className={`chip border ${STATUS_COLORS[k]}`}>
            {v}
          </span>
        ))}
        <span className="chip border border-ink-700">
          Click ngày trống để log bù
        </span>
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-[520px]" />
      ) : (
        <div className="card p-3">
          <div className="grid grid-cols-7 text-xs text-ink-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.flat().map((day, i) => {
              if (!day)
                return <div key={i} className="aspect-square rounded-lg bg-ink-900/40" />;
              const d = new Date(day.date);
              const hasWorkout = day.workouts.length > 0;
              const isFuture = day.date > todayISO();

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isFuture && !hasWorkout}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg border p-1.5 text-xs flex flex-col text-left transition-colors ${
                    STATUS_COLORS[day.status] ||
                    'bg-ink-800 text-ink-400 border-ink-700'
                  } ${
                    !isFuture || hasWorkout
                      ? 'hover:border-accent cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  title={
                    hasWorkout
                      ? 'Mở workout'
                      : isFuture
                      ? 'Không thể log tương lai'
                      : 'Log bù ngày này'
                  }
                >
                  <div className="text-[11px] opacity-80">{d.getDate()}</div>
                  <div className="mt-auto truncate text-[10px]">
                    {hasWorkout ? day.workouts[0].name : STATUS_LABEL[day.status]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
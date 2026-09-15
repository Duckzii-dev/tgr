import { useEffect, useState } from 'react';
import { useTheme } from '../lib/theme.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { useAuth } from '../lib/auth.jsx';
import Skeleton from '../components/Skeleton.jsx';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const TYPES = ['strength', 'cardio', 'recovery', 'rest'];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const { refresh } = useAuth();
  const { data, loading, refresh: reload } = useFetch(() => api.get('/profile'), []);
  const schedule = useFetch(() => api.get('/profile/schedule'), []);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [name, setName] = useState('');
  const [sched, setSched] = useState({});

  useEffect(() => {
    if (data?.user) setName(data.user.name || '');
  }, [data]);

  useEffect(() => {
    if (schedule.data?.schedule) {
      const m = {};
      for (const s of schedule.data.schedule) {
        m[s.weekday] = { workoutType: s.workoutType, isPlanned: s.isPlanned };
      }
      setSched(m);
    }
  }, [schedule.data]);

  const saveProfile = async () => {
    try {
      await api.put('/profile', { name });
      toast('Profile updated');
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile/password', pw);
      toast('Password updated');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const unlink = async () => {
    try {
      await api.post('/auth/google/unlink');
      toast('Google unlinked');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const saveSchedule = async () => {
    try {
      for (let wd = 0; wd < 7; wd++) {
        const s = sched[wd];
        if (!s) continue;
        await api.post('/profile/schedule', {
          weekday: wd,
          workoutType: s.workoutType,
          isPlanned: s.isPlanned,
        });
      }
      toast('Schedule saved');
      schedule.refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const setDay = (wd, patch) =>
    setSched((s) => ({
      ...s,
      [wd]: { workoutType: 'strength', isPlanned: true, ...s[wd], ...patch },
    }));

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="card p-4 space-y-3">
        <div className="font-semibold">Appearance</div>
        <div className="flex gap-2 flex-wrap">
          {['dark', 'light', 'system'].map((t) => (
            <button
              key={t}
              className={`chip ${theme === t ? 'border-accent text-accent' : ''}`}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="font-semibold">Profile</div>
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={saveProfile}>
          Save
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="font-semibold">Password</div>
        {data?.user?.hasPassword && (
          <div>
            <label className="label">Current Password</label>
            <input
              className="input"
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            />
          </div>
        )}
        <div>
          <label className="label">New Password</label>
          <input
            className="input"
            type="password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" onClick={savePassword}>
          Update Password
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="font-semibold">Google</div>
        {data?.user?.googleId ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink-300">Google account linked</div>
            <button className="btn btn-ghost" onClick={unlink}>
              Unlink
            </button>
          </div>
        ) : (
          <a className="btn btn-ghost" href={`${api.BASE}/auth/google`}>
            Link Google Account
          </a>
        )}
      </div>

      <div className="card p-4 space-y-3">
        <div className="font-semibold">Training Schedule</div>
        {DAYS.map((d, wd) => {
          const cur = sched[wd] || { workoutType: 'rest', isPlanned: true };
          return (
            <div key={wd} className="flex items-center gap-2 flex-wrap">
              <div className="w-24 text-sm text-ink-300">{d}</div>
              <select
                className="input flex-1 min-w-[140px]"
                value={cur.workoutType}
                onChange={(e) => setDay(wd, { workoutType: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="text-xs text-ink-400 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={cur.isPlanned}
                  onChange={(e) => setDay(wd, { isPlanned: e.target.checked })}
                />{' '}
                Planned
              </label>
            </div>
          );
        })}
        <button className="btn btn-primary" onClick={saveSchedule}>
          Save Schedule
        </button>
      </div>
    </div>
  );
}
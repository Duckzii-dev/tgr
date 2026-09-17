import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Plus, Minus, Timer, X } from 'lucide-react';
import { getRestTimerSettings } from '../lib/restTimerSettings.js';

export default function RestTimer({
  onClose,
  initialDuration = 90,
  autoStart = true,
  floating = false,
  nextExercise = null,
}) {
  const [duration, setDuration] = useState(initialDuration);
  const [remaining, setRemaining] = useState(initialDuration);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const durationRef = useRef(duration);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    setDuration(initialDuration);
    setRemaining(initialDuration);
    setRunning(autoStart);
  }, [initialDuration, autoStart]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          notifyDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const notifyDone = async () => {
    const settings = getRestTimerSettings();

    if (settings.notificationEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Rest complete', { body: 'Time to lift!' });
      } else if (Notification.permission !== 'denied') {
        try {
          const p = await Notification.requestPermission();
          if (p === 'granted') {
            new Notification('Rest complete', { body: 'Time to lift!' });
          }
        } catch {}
      }
    }

    if (settings.soundEnabled) fallbackBeep();
  };

  const fallbackBeep = () => {
    try {
      new Audio(
        'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
      ).play();
    } catch {}
  };

  const start = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    setRunning(true);
  };

  const setPreset = (s) => {
    setDuration(s);
    setRemaining(s);
    setRunning(true);
  };

  const adjust = (delta) => {
    setDuration((d) => Math.max(15, d + delta));
    setRemaining((r) => Math.max(0, r + delta));
  };

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-400">
          <Timer className="w-4 h-4" /> Rest Timer
        </div>
        <button
          onClick={onClose}
          className="text-ink-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <div className="text-4xl font-semibold tabular-nums text-center">
          {String(Math.floor(remaining / 60)).padStart(2, '0')}:
          {String(remaining % 60).padStart(2, '0')}
        </div>
        <div className="h-1 bg-ink-800 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-accent transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {nextExercise && (
        <div className="text-xs text-ink-400 text-center">
          Next: <span className="text-white">{nextExercise.name}</span>
          {nextExercise.weight && nextExercise.reps
            ? ` · ${nextExercise.weight}kg × ${nextExercise.reps}`
            : ''}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {[30, 60, 90, 120, 180].map((s) => (
          <button
            key={s}
            className={`chip ${duration === s ? 'border-accent text-accent' : ''}`}
            onClick={() => setPreset(s)}
          >
            {s}s
          </button>
        ))}
        <button
          className="chip"
          onClick={() => {
            const v = prompt('Custom seconds (15-600):', String(duration));
            if (v) setPreset(Math.min(600, Math.max(15, parseInt(v) || 90)));
          }}
        >
          Custom
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="btn btn-ghost" onClick={() => adjust(-30)}>
          <Minus className="w-4 h-4" />30
        </button>
        <button
          className="btn btn-primary"
          onClick={() => (running ? setRunning(false) : start())}
        >
          {running ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>
        <button className="btn btn-ghost" onClick={() => adjust(30)}>
          <Plus className="w-4 h-4" />30
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setRunning(false);
            setRemaining(durationRef.current);
          }}
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      </div>
    </div>
  );

  if (floating) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 w-72 card p-4 shadow-2xl border-accent/40 bg-ink-900">
        {content}
      </div>
    );
  }

  return <div className="card p-4 space-y-3">{content}</div>;
}
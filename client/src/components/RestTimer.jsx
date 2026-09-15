import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Plus, Minus, Timer } from 'lucide-react';

export default function RestTimer({ onClose }) {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Rest complete', { body: 'Time to lift!' });
          } else {
            try {
              new Audio(
                'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
              ).play();
            } catch {}
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const setPreset = (s) => {
    setDuration(s);
    setRemaining(s);
    setRunning(true);
  };

  const adjust = (delta) => {
    setDuration((d) => Math.max(15, d + delta));
    setRemaining((r) => Math.max(0, r + delta));
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-400">
          <Timer className="w-4 h-4" /> Rest Timer
        </div>
        <button onClick={onClose} className="text-xs text-ink-400 hover:text-white">
          Close
        </button>
      </div>

      <div className="text-4xl font-semibold tabular-nums text-center">
        {String(Math.floor(remaining / 60)).padStart(2, '0')}:
        {String(remaining % 60).padStart(2, '0')}
      </div>

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
        <button className="btn btn-primary" onClick={() => setRunning((x) => !x)}>
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
            setRemaining(duration);
          }}
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      </div>
    </div>
  );
}
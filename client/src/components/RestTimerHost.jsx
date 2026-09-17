import { useEffect, useState } from 'react';
import RestTimer from './RestTimer.jsx';

export default function RestTimerHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const { duration, nextExercise } = e.detail || {};
      setState({
        duration: duration || 90,
        nextExercise: nextExercise || null,
      });
    };
    window.addEventListener('rest-timer:start', handler);
    return () => window.removeEventListener('rest-timer:start', handler);
  }, []);

  if (!state) return null;

  return (
    <RestTimer
      floating
      initialDuration={state.duration}
      autoStart
      nextExercise={state.nextExercise}
      onClose={() => setState(null)}
    />
  );
}

export function startRestTimer({ duration, nextExercise }) {
  window.dispatchEvent(
    new CustomEvent('rest-timer:start', {
      detail: { duration, nextExercise },
    })
  );
}
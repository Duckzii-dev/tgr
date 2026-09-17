const KEY = 'tgr.warmup';

const DEFAULTS = {
  enabled: true,
  sets: [
    { percent: 40, reps: 8, restSeconds: 60 },
    { percent: 55, reps: 5, restSeconds: 60 },
    { percent: 70, reps: 3, restSeconds: 90 },
    { percent: 85, reps: 2, restSeconds: 120 },
  ],
  roundTo: 2.5,
};

export function getWarmupSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, sets: DEFAULTS.sets.map((s) => ({ ...s })) };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      sets: Array.isArray(parsed.sets) && parsed.sets.length
        ? parsed.sets.map((s) => ({ ...s }))
        : DEFAULTS.sets.map((s) => ({ ...s })),
    };
  } catch {
    return { ...DEFAULTS, sets: DEFAULTS.sets.map((s) => ({ ...s })) };
  }
}

export function setWarmupSettings(patch) {
  const cur = getWarmupSettings();
  const next = { ...cur, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resetWarmupSettings() {
  localStorage.removeItem(KEY);
  return getWarmupSettings();
}

export function generateWarmupSets(workingWeight, settings) {
  const cfg = settings || getWarmupSettings();
  const round = Number(cfg.roundTo) || 2.5;
  const w = Number(workingWeight);
  if (!w || w <= 0) return [];

  return cfg.sets
    .map((s) => {
      const raw = (w * s.percent) / 100;
      const rounded = Math.round(raw / round) * round;
      return {
        weight: Math.max(round, rounded),
        reps: Math.max(1, Number(s.reps) || 5),
        restSeconds: Number(s.restSeconds) || 60,
        percent: s.percent,
      };
    })
    .filter((s) => s.weight < w)
    .sort((a, b) => a.weight - b.weight);
}

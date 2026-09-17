const KEY = 'tgr.restTimer';

const DEFAULTS = {
  autoStart: true,
  defaultDuration: 90,
  soundEnabled: true,
  notificationEnabled: true,
};

export function getRestTimerSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setRestTimerSettings(patch) {
  const current = getRestTimerSettings();
  const next = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
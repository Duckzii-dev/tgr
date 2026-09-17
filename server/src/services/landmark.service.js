export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
];

/**
 * Default landmarks (sets per week) cho mỗi muscle group.
 * Tham khảo: RP Strength / Renaissance Periodization.
 */
export const DEFAULT_LANDMARKS = {
  chest: { mev: 8, mav: 14, mrv: 22 },
  back: { mev: 10, mav: 16, mrv: 25 },
  shoulders: { mev: 8, mav: 16, mrv: 26 },
  biceps: { mev: 6, mav: 12, mrv: 20 },
  triceps: { mev: 6, mav: 12, mrv: 20 },
  legs: { mev: 8, mav: 16, mrv: 24 },
  core: { mev: 4, mav: 10, mrv: 16 },
  cardio: { mev: 0, mav: 0, mrv: 0 },
};

export function defaultFor(muscleGroup) {
  return DEFAULT_LANDMARKS[muscleGroup] || { mev: 6, mav: 12, mrv: 20 };
}

/**
 * Phân tích trạng thái so với landmarks.
 * @returns { status: 'under' | 'optimal' | 'high' | 'excessive', label, color }
 */
export function analyzeStatus(currentSets, landmark) {
  const { mev, mav, mrv } = landmark;
  if (mrv == null || mav == null || mev == null) {
    return { status: 'unknown', label: '—', color: '#8a93a0' };
  }
  if (currentSets < mev) {
    return { status: 'under', label: 'Under MEV', color: '#5ed3ff' };
  }
  if (currentSets <= mav) {
    return { status: 'optimal', label: 'Optimal', color: '#c6ff3d' };
  }
  if (currentSets <= mrv) {
    return { status: 'high', label: 'High', color: '#ffb038' };
  }
  return { status: 'excessive', label: 'Above MRV', color: '#ff5e5e' };
}

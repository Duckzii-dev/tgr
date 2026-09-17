/**
 * Anatome helpers — đã chuyển sang local SVG.
 * Chỉ giữ để fallback khi cần.
 */

const API_BASE = 'https://api.anatome.dev';

export const ANATOME_SLUG_MAP = {
  neck: 'neck',
  traps: 'traps',
  front_delt: 'front-delts',
  side_delt: 'side-delts',
  rear_delt: 'rear-delts',
  upper_chest: 'upper-chest',
  chest: 'chest',
  lats: 'lats',
  middle_back: 'middle-back',
  lower_back: 'lower-back',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abs: 'abs',
  obliques: 'obliques',
  glutes: 'glutes',
  quads: 'quads',
  hamstrings: 'hamstrings',
  calves: 'calves',
};

export function recoveryHex(percent) {
  if (percent >= 95) return 'C6FF3D';
  if (percent >= 75) return 'FFB038';
  if (percent >= 50) return 'FF8F3D';
  if (percent >= 25) return 'FF5E5E';
  return '8A1F1F';
}

export function buildAnatomeUrl(recovery, view = 'front', gender = 'male') {
  const layers = [];
  for (const r of recovery) {
    const slug = ANATOME_SLUG_MAP[r.muscleGroup];
    if (!slug) continue;
    if (!r.lastTrainedAt) continue;
    layers.push(`${recoveryHex(r.percent)}:${slug}`);
  }
  const params = new URLSearchParams();
  if (layers.length) params.set('layers', layers.join(','));
  params.set('view', view);
  params.set('gender', gender);
  params.set('output', 'raw');
  return `${API_BASE}/generateImage?${params.toString()}`;
}

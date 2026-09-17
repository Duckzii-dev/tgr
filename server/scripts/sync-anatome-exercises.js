#!/usr/bin/env node
/**
 * Sync Anatome exercises → local JSON (flattened).
 * Bỏ `raw`, giữ các field cần dùng.
 * Usage: node server/scripts/sync-anatome-exercises.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://api.anatome.dev';
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const LIMIT = (() => {
  const idx = args.indexOf('--limit');
  if (idx >= 0 && args[idx + 1]) return Number(args[idx + 1]);
  return 0;
})();

const POPULAR_QUERIES = [
  'bench', 'chest', 'fly', 'push', 'pec', 'dip',
  'row', 'pull', 'lat', 'deadlift', 'shrug', 'back',
  'shoulder', 'press', 'raise', 'delt', 'overhead',
  'curl', 'tricep', 'bicep', 'extension', 'hammer', 'skull',
  'squat', 'lunge', 'leg', 'calf', 'glute', 'hamstring', 'quad',
  'crunch', 'plank', 'sit-up', 'ab', 'russian', 'leg raise',
  'run', 'bike', 'jump', 'burpee', 'rope', 'stretch', 'mobility',
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function searchExercises(query, limit = 50) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  try {
    const data = await fetchJSON(`${API_BASE}/searchExercises?${params}`);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.exercises)) return data.exercises;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (e) {
    console.warn(`  ⚠️  searchExercises("${query}") failed: ${e.message}`);
    return [];
  }
}

/**
 * Flatten exercise — bỏ raw, giữ field cần dùng.
 */
function normalizeExercise(raw) {
  if (!raw) return null;
  const r = raw.raw || raw;

  // ID ưu tiên ext_id (slug ổn định), fallback raw.id
  const id = r.ext_id || raw.id || raw.name?.toLowerCase().replace(/\s+/g, '_');

  // Primary muscles: ưu tiên source (tên người đọc) rồi mới tới anatome slug
  const primaryMuscles =
    r.primaryMuscles ||
    r.source_primaryMuscles ||
    [];
  const secondaryMuscles =
    r.secondaryMuscles ||
    r.source_secondaryMuscles ||
    raw.secondaryMuscles ||
    [];

  // Anatome slugs
  const muscleSlugs = r.anatome_primary_slugs || raw.muscleSlugs || [];
  const secondarySlugs = r.anatome_secondary_slugs || [];

  // Layers payload để render muscle map khi cần
  const layersPayload = r.anatome_layers_payload || [];

  // Body part fallback từ primary muscles
  const bodyPart =
    raw.bodyPart ||
    (primaryMuscles.length ? primaryMuscles[0] : null);

  return {
    id,
    name: raw.name || r.name,
    bodyPart,

    primaryMuscles,
    secondaryMuscles,
    muscleSlugs,
    secondarySlugs,
    layersPayload,

    equipment: raw.equipment || r.equipment || null,
    category: raw.category || r.category || null,
    difficulty: raw.difficulty || r.level || null,
    mechanic: raw.mechanic || r.mechanic || null,
    force: raw.force || r.force || null,
    movementType: r.movementType || null,

    instructions: raw.instructions || r.instructions || [],
    description: raw.description || null,

    videoUrl: r.video_url || raw.videoUrl || null,
    videoSpecific: r.video_exercise_specific || false,
    hasLicensedMedia: r.has_licensed_media || false,

    keywords: r.keywords || [],
  };
}

async function main() {
  console.log('🚀 Sync Anatome exercises → local JSON (flattened)');
  console.log(`   API: ${API_BASE}`);
  console.log(`   Output: ${OUT_FILE}`);
  console.log(`   Dry run: ${DRY}`);
  console.log(`   Limit: ${LIMIT || 'unlimited'}`);
  console.log('');

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  const seen = new Map();
  let totalFetched = 0;

  for (const q of POPULAR_QUERIES) {
    process.stdout.write(`   Searching "${q}"... `);
    const results = await searchExercises(q, LIMIT || 100);
    totalFetched += results.length;

    for (const r of results) {
      const norm = normalizeExercise(r);
      if (!norm || !norm.id) continue;
      if (!seen.has(norm.id)) seen.set(norm.id, norm);
    }
    console.log(`${results.length} → ${seen.size} unique total`);
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log('');
  console.log(`📊 Total fetched: ${totalFetched}`);
  console.log(`📊 Unique exercises: ${seen.size}`);

  if (seen.size === 0) {
    console.error('❌ No exercises fetched. API may be down.');
    process.exit(1);
  }

  const sorted = [...seen.values()].sort((a, b) => {
    const bp = (a.bodyPart || '').localeCompare(b.bodyPart || '');
    if (bp !== 0) return bp;
    return (a.name || '').localeCompare(b.name || '');
  });

  const output = {
    _meta: {
      source: 'https://api.anatome.dev',
      repo: 'https://github.com/NextSolutionsStudio/anatome',
      license: 'Apache-2.0',
      syncedAt: new Date().toISOString(),
      totalExercises: sorted.length,
      queries: POPULAR_QUERIES.length,
    },
    exercises: sorted,
  };

  if (DRY) {
    console.log('🔍 Dry run — sample:');
    console.log(JSON.stringify(sorted.slice(0, 2), null, 2));
    return;
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  const stats = await fs.stat(OUT_FILE);
  console.log(`✅ Wrote ${OUT_FILE}`);
  console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`   Exercises: ${sorted.length}`);
  console.log('');

  const byPart = {};
  for (const e of sorted) {
    const bp = e.bodyPart || 'unknown';
    byPart[bp] = (byPart[bp] || 0) + 1;
  }
  console.log('📈 By body part:');
  for (const [bp, count] of Object.entries(byPart).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${bp.padEnd(20)} ${count}`);
  }
  console.log('');
  console.log('🎉 Sync complete.');
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});

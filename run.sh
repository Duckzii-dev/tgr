#!/usr/bin/env bash
# ================================================================
# FEATURE 12: FLATTEN ANATOME JSON + LIBRARY UI REDESIGN
# Chạy từ root: bash feature12-anatome-flatten.sh
# ================================================================
set -euo pipefail

ROOT="$(pwd)"
echo "📁 Root: $ROOT"

# ============================================================
# 1. server/scripts/sync-anatome-exercises.js (flatten)
# ============================================================
mkdir -p server/scripts
cat > server/scripts/sync-anatome-exercises.js <<'EOF'
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
EOF
chmod +x server/scripts/sync-anatome-exercises.js
echo "✅ server/scripts/sync-anatome-exercises.js"

# ============================================================
# 2. server/src/services/anatome.service.js
# ============================================================
mkdir -p server/src/services
cat > server/src/services/anatome.service.js <<'EOF'
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXERCISES_FILE = path.join(
  __dirname, '..', '..', 'public', 'anatome-exercises.json'
);

let _cache = null;

export async function loadAnatomeExercises() {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(EXERCISES_FILE, 'utf8');
    const data = JSON.parse(raw);
    _cache = {
      meta: data._meta || {},
      exercises: data.exercises || [],
    };
  } catch {
    _cache = { meta: {}, exercises: [] };
  }
  return _cache;
}

export async function searchLocalExercises(query, opts = {}) {
  const { exercises } = await loadAnatomeExercises();
  const {
    bodyPart, equipment, muscleSlug, difficulty, category,
    limit = 50, offset = 0,
  } = opts;

  const q = String(query || '').toLowerCase().trim();

  const filtered = exercises.filter((e) => {
    if (q) {
      const haystack = [
        e.name,
        ...(e.keywords || []),
        ...(e.primaryMuscles || []),
        ...(e.secondaryMuscles || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (bodyPart && e.bodyPart !== bodyPart) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (difficulty && e.difficulty !== difficulty) return false;
    if (category && e.category !== category) return false;
    if (muscleSlug && !(e.muscleSlugs || []).includes(muscleSlug)) return false;
    return true;
  });

  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  return { exercises: sliced, total };
}

export async function getLocalExercise(id) {
  const { exercises } = await loadAnatomeExercises();
  return exercises.find((e) => e.id === id) || null;
}

export async function listFacets() {
  const { exercises } = await loadAnatomeExercises();
  const bodyParts = new Set();
  const equipments = new Set();
  const difficulties = new Set();
  const categories = new Set();
  const muscleSlugs = new Set();

  for (const e of exercises) {
    if (e.bodyPart) bodyParts.add(e.bodyPart);
    if (e.equipment) equipments.add(e.equipment);
    if (e.difficulty) difficulties.add(e.difficulty);
    if (e.category) categories.add(e.category);
    for (const m of e.muscleSlugs || []) muscleSlugs.add(m);
  }

  return {
    bodyParts: [...bodyParts].sort(),
    equipments: [...equipments].sort(),
    difficulties: [...difficulties].sort(),
    categories: [...categories].sort(),
    muscleSlugs: [...muscleSlugs].sort(),
    total: exercises.length,
  };
}
EOF
echo "✅ server/src/services/anatome.service.js"

# ============================================================
# 3. server/src/controllers/anatome.controller.js
# ============================================================
mkdir -p server/src/controllers
cat > server/src/controllers/anatome.controller.js <<'EOF'
import { httpError } from '../middleware/error.middleware.js';
import {
  searchLocalExercises,
  getLocalExercise,
  listFacets,
  loadAnatomeExercises,
} from '../services/anatome.service.js';

export async function searchExercises(req, res) {
  const { q, bodyPart, equipment, muscleSlug, difficulty, category, limit, offset } = req.query;
  const result = await searchLocalExercises(q, {
    bodyPart: bodyPart || null,
    equipment: equipment || null,
    muscleSlug: muscleSlug || null,
    difficulty: difficulty || null,
    category: category || null,
    limit: limit ? Math.min(200, Number(limit)) : 50,
    offset: offset ? Number(offset) : 0,
  });
  res.json(result);
}

export async function getExercise(req, res) {
  const { id } = req.params;
  const exercise = await getLocalExercise(id);
  if (!exercise) throw httpError(404, 'Exercise not found');
  res.json({ exercise });
}

export async function facets(_req, res) {
  const data = await listFacets();
  res.json(data);
}

export async function meta(_req, res) {
  const { meta, exercises } = await loadAnatomeExercises();
  res.json({ meta, total: exercises.length });
}
EOF
echo "✅ server/src/controllers/anatome.controller.js"

# ============================================================
# 4. client/src/pages/AnatomeLibrary.jsx
# ============================================================
mkdir -p client/src/pages
cat > client/src/pages/AnatomeLibrary.jsx <<'EOF'
import { useState } from 'react';
import { Search, Filter, X, Play, Activity } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import { fmtNumber } from '../lib/format.js';

const API_ANATOME = 'https://api.anatome.dev';

function buildAnatomeUrl(ex) {
  if (!ex?.layersPayload?.length) return null;
  const layers = ex.layersPayload
    .map((l) => {
      const color = (l.color || '#DC2626').replace('#', '');
      const muscles = (l.muscles || []).join('%2C');
      return `${color}:${muscles}`;
    })
    .join(',');
  return `${API_ANATOME}/generateImage?gender=male&view=dual&layers=${layers}&output=raw`;
}

export default function AnatomeLibrary() {
  const [q, setQ] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);

  const facets = useFetch(() => api.get('/anatome/facets'), []);
  const meta = useFetch(() => api.get('/anatome/meta'), []);

  const { data, loading } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (bodyPart) p.set('bodyPart', bodyPart);
      if (equipment) p.set('equipment', equipment);
      if (difficulty) p.set('difficulty', difficulty);
      if (muscleSlug) p.set('muscleSlug', muscleSlug);
      if (category) p.set('category', category);
      p.set('limit', '100');
      return api.get(`/anatome/exercises?${p}`);
    },
    [q, bodyPart, equipment, difficulty, muscleSlug, category]
  );

  const exercises = data?.exercises || [];
  const total = data?.total || 0;
  const hasFilters = bodyPart || equipment || difficulty || muscleSlug || category;

  const clearFilters = () => {
    setBodyPart('');
    setEquipment('');
    setDifficulty('');
    setMuscleSlug('');
    setCategory('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Exercise Library</h1>
        <p className="text-sm text-ink-400 mt-1">
          {fmtNumber(meta.data?.total) || '...'} bài tập từ Anatome DB · Apache-2.0
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Tìm bài tập (vd: bench, squat, curl)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            className={`btn btn-ghost ${showFilters ? 'border-accent text-accent' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-ink-700">
            <div>
              <label className="label">Body Part</label>
              <select className="input" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.bodyParts || []).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Equipment</label>
              <select className="input" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.equipments || []).map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.difficulties || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.categories || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="label">Muscle</label>
              <select className="input" value={muscleSlug} onChange={(e) => setMuscleSlug(e.target.value)}>
                <option value="">All</option>
                {(facets.data?.muscleSlugs || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                className="btn btn-ghost text-xs col-span-2 md:col-span-4 justify-center"
                onClick={clearFilters}
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : exercises.length ? (
        <>
          <div className="text-xs text-ink-400">
            Hiện {exercises.length} / {total} bài tập
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setDetail(ex)}
                className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors"
              >
                <div className="font-medium text-sm line-clamp-2 min-h-[2.4em]">
                  {ex.name}
                </div>

                {ex.primaryMuscles?.length > 0 && (
                  <div className="text-xs text-accent line-clamp-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span>{ex.primaryMuscles.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {ex.equipment && (
                    <span className="chip text-[10px]">{ex.equipment}</span>
                  )}
                  {ex.difficulty && (
                    <span className="chip text-[10px]">{ex.difficulty}</span>
                  )}
                  {ex.mechanic && (
                    <span className="chip text-[10px]">{ex.mechanic}</span>
                  )}
                </div>

                {ex.videoUrl && (
                  <div className="text-[10px] text-ink-500 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Video
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Empty title="Không tìm thấy bài tập" hint="Thử đổi từ khoá hoặc filter." />
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || ''}
        wide
      >
        {detail && <ExerciseDetailContent ex={detail} />}
      </Modal>
    </div>
  );
}

function ExerciseDetailContent({ ex }) {
  const anatomeUrl = buildAnatomeUrl(ex);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ex.equipment && <span className="chip">{ex.equipment}</span>}
        {ex.difficulty && <span className="chip">{ex.difficulty}</span>}
        {ex.category && <span className="chip">{ex.category}</span>}
        {ex.mechanic && <span className="chip">{ex.mechanic}</span>}
        {ex.force && <span className="chip">{ex.force}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ex.primaryMuscles?.length > 0 && (
          <div>
            <div className="label">Primary Muscles</div>
            <div className="text-sm text-accent">
              {ex.primaryMuscles.join(', ')}
            </div>
          </div>
        )}
        {ex.secondaryMuscles?.length > 0 && (
          <div>
            <div className="label">Secondary</div>
            <div className="text-sm text-ink-300">
              {ex.secondaryMuscles.join(', ')}
            </div>
          </div>
        )}
      </div>

      {anatomeUrl && (
        <div>
          <button
            className="btn btn-ghost w-full justify-center"
            onClick={() => setShowMap((v) => !v)}
          >
            <Activity className="w-4 h-4" />
            {showMap ? 'Hide' : 'Show'} Muscle Map
          </button>
          {showMap && (
            <div className="mt-3 flex justify-center bg-ink-950 rounded-xl p-4 min-h-[420px]">
              {mapError ? (
                <div className="text-xs text-red-400 self-center">
                  Muscle map unavailable (Anatome API offline)
                </div>
              ) : (
                <img
                  src={anatomeUrl}
                  alt="Muscle map"
                  width={280}
                  height={420}
                  className="max-w-full"
                  onError={() => setMapError(true)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {ex.videoUrl && (
        <div>
          <div className="label">Video</div>
          <a
            href={ex.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost w-full justify-center"
          >
            <Play className="w-4 h-4" /> Watch on YouTube
          </a>
        </div>
      )}

      {ex.instructions?.length > 0 && (
        <div>
          <div className="label">Instructions</div>
          <ol className="list-decimal ml-5 text-sm text-ink-300 space-y-1">
            {ex.instructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {ex.keywords?.length > 0 && (
        <div>
          <div className="label">Keywords</div>
          <div className="flex flex-wrap gap-1">
            {ex.keywords.slice(0, 20).map((k, i) => (
              <span key={i} className="chip text-[10px]">{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
EOF
echo "✅ client/src/pages/AnatomeLibrary.jsx"

echo ""
echo "=============================================="
echo "✅ FEATURE 12 — Flatten + UI Library hoàn tất"
echo "=============================================="
echo ""
echo "BƯỚC TIẾP THEO:"
echo ""
echo "  1. Chạy sync lại (flatten):"
echo "     cd ~/Code/tgr"
echo "     node server/scripts/sync-anatome-exercises.js"
node server/scripts/sync-anatome-exercises.js
echo ""
echo "  2. Verify:"
echo "     jq '.exercises | length' server/public/anatome-exercises.json"
echo "     ls -lh server/public/anatome-exercises.json"
echo "     jq '.exercises[0]' server/public/anatome-exercises.json"
echo ""
echo "  3. Commit + push:"
git add .
git commit -m 'Feature 12: Flatten anatome JSON + redesigned library'
git push
echo ""
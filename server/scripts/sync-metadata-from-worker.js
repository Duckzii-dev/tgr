#!/usr/bin/env node
/**
 * Sync metadata từ worker local.
 * Worker endpoint: /searchExercises?q=X&limit=Y
 * Response: { ok, total_matched, offset, limit, next_cursor, results: [...] }
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER = process.env.ANATOME_API || 'http://localhost:8787';
const MAPS_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

/**
 * Extract array results từ response worker.
 * Worker trả về { ok, results: [...] } hoặc array trực tiếp.
 */
function extractResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.exercises)) return data.exercises;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

/**
 * Search với pagination để lấy hết.
 * Worker giới hạn limit (thường ≤ 100), dùng next_cursor hoặc offset.
 */
async function fetchAllByQuery(query, maxTotal = 2000) {
  const seen = new Map();
  let offset = 0;
  const pageSize = 100;

  while (offset < maxTotal) {
    const url = `${WORKER}/searchExercises?q=${encodeURIComponent(query)}&limit=${pageSize}&offset=${offset}`;
    try {
      const data = await fetchJSON(url);
      const results = extractResults(data);

      if (results.length === 0) break;

      for (const ex of results) {
        const id = ex.ext_id || ex.id || ex.name;
        if (id && !seen.has(id)) seen.set(id, ex);
      }

      if (results.length < pageSize) break;
      offset += pageSize;
    } catch (e) {
      console.warn(`   Query "${query}" offset ${offset} failed: ${e.message}`);
      break;
    }
  }

  return [...seen.values()];
}

async function main() {
  console.log(`🚀 Sync metadata từ worker: ${WORKER}`);
  console.log('');

  // 1. Lấy danh sách SVG files local
  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter(f => f.endsWith('.svg'));
  console.log(`   SVG files local: ${svgFiles.length}`);
  console.log('');

  // 2. Query rộng — nhiều chữ cái để lấy hết dataset
  const QUERIES = [
    'a', 'e', 'i', 'o', 'u',
    'b', 'c', 'd', 'f', 'g',
    'h', 'j', 'k', 'l', 'm',
    'n', 'p', 'q', 'r', 's',
    't', 'v', 'w', 'x', 'y', 'z',
    'press', 'curl', 'row', 'squat', 'deadlift',
    'raise', 'fly', 'pull', 'push', 'extension',
    'stretch', 'plank', 'crunch', 'lunge', 'thrust',
  ];

  const allByExtId = new Map();
  const allByName = new Map();

  for (const q of QUERIES) {
    process.stdout.write(`   Query "${q}"... `);
    const results = await fetchAllByQuery(q, 2000);

    for (const ex of results) {
      const ext = ex.ext_id || ex.id;
      if (ext && !allByExtId.has(ext)) allByExtId.set(ext, ex);
      if (ex.name && !allByName.has(ex.name.toLowerCase())) allByName.set(ex.name.toLowerCase(), ex);
    }

    console.log(`${results.length} (total: ${allByExtId.size})`);
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('');
  console.log(`   Total by ext_id: ${allByExtId.size}`);
  console.log(`   Total by name:   ${allByName.size}`);
  console.log('');

  // 3. Match SVG files
  function norm(s) {
    return String(s).toLowerCase().replace(/[\s_/-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  const results = [];
  let matched = 0;
  const unmatched = [];

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const n = norm(id);

    let meta = allByExtId.get(id);
    if (!meta) meta = allByName.get(id.toLowerCase());
    if (!meta) {
      // Thử normalize
      for (const [k, v] of allByExtId) {
        if (norm(k) === n) { meta = v; break; }
      }
    }

    if (meta) matched++;
    else unmatched.push(id);

    const r = meta || {};

    results.push({
      id,
      name: r.name || id.replace(/_/g, ' '),
      extId: r.ext_id || null,
      primaryMuscles: r.primaryMuscles || [],
      secondaryMuscles: r.secondaryMuscles || [],
      muscleSlugs: r.anatome_primary_slugs || [],
      secondarySlugs: r.anatome_secondary_slugs || [],
      equipment: r.equipment || null,
      difficulty: r.level || null,
      category: r.category || null,
      mechanic: r.mechanic || null,
      force: r.force || null,
      instructions: r.instructions || [],
      videoUrl: r.gif_url || r.image_url || null,
      svgPath: `/static/muscle-maps/${file}`,
      matched: !!meta,
    });
  }

  console.log(`✅ Matched:   ${matched}/${svgFiles.length}`);
  console.log(`❌ Unmatched: ${unmatched.length}`);
  console.log('');

  results.sort((a, b) => a.name.localeCompare(b.name));

  const byMuscle = {};
  for (const ex of results) {
    for (const m of ex.muscleSlugs || []) {
      byMuscle[m] = (byMuscle[m] || 0) + 1;
    }
  }
  console.log('📈 Muscle distribution:');
  for (const [m, c] of Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`   ${m.padEnd(20)} ${c}`);
  }
  console.log('');

  const output = {
    _meta: {
      source: 'worker-sync',
      workerUrl: WORKER,
      generatedAt: new Date().toISOString(),
      totalExercises: results.length,
      matched,
      unmatched: unmatched.length,
      totalAnatomeFetched: allByExtId.size,
    },
    exercises: results,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  const stats = await fs.stat(OUT_FILE);
  console.log(`✅ Wrote ${OUT_FILE} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log('');

  if (unmatched.length > 0 && unmatched.length < 100) {
    console.log(`⚠️  Unmatched (${unmatched.length}):`);
    unmatched.slice(0, 50).forEach(u => console.log(`   - ${u}`));
  } else if (unmatched.length > 0) {
    console.log(`⚠️  ${unmatched.length} unmatched (first 30):`);
    unmatched.slice(0, 30).forEach(u => console.log(`   - ${u}`));
  }
}

main().catch(e => { console.error('❌', e); process.exit(1); });

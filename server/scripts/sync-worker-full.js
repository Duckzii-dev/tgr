#!/usr/bin/env node
/**
 * Sync metadata từ worker local — dùng cursor pagination.
 * Worker trả { ok, total_matched, next_cursor, results: [...] }.
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function extractResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.exercises)) return data.exercises;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

/**
 * Lấy TẤT CẢ exercises qua cursor pagination.
 * maxTotal để tránh infinite loop.
 */
async function fetchAllByQuery(query, maxTotal = 10000) {
  const seen = new Map();
  let cursor = null;
  let pageCount = 0;
  const maxPages = 500;

  while (pageCount < maxPages) {
    const url = new URL(`${WORKER}/searchExercises`);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '100');  // Thử 100
    if (cursor) url.searchParams.set('cursor', cursor);

    try {
      const data = await fetchJSON(url.toString());
      const results = extractResults(data);

      if (results.length === 0) break;

      let newCount = 0;
      for (const ex of results) {
        const id = ex.ext_id || ex.id || ex.name;
        if (id && !seen.has(id)) {
          seen.set(id, ex);
          newCount++;
        }
      }

      // Nếu page này không có gì mới → dừng
      if (newCount === 0) break;

      cursor = data.next_cursor;
      if (!cursor) break;
      if (seen.size >= maxTotal) break;

      pageCount++;
      // Rate limit friendly
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      console.warn(`\n   Query "${query}" page ${pageCount} failed: ${e.message}`);
      break;
    }
  }

  return [...seen.values()];
}

async function main() {
  console.log(`🚀 Sync FULL từ worker: ${WORKER}`);
  console.log('');

  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter(f => f.endsWith('.svg'));
  console.log(`   SVG files local: ${svgFiles.length}`);
  console.log('');

  // Query rộng — bắt đầu từng chữ cái để cover toàn bộ dataset
  const QUERIES = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  ];

  const allByExtId = new Map();
  const allByName = new Map();

  for (const q of QUERIES) {
    process.stdout.write(`   Query "${q}"... `);
    const startSize = allByExtId.size;
    const results = await fetchAllByQuery(q, 10000);

    for (const ex of results) {
      const ext = ex.ext_id || ex.id;
      if (ext && !allByExtId.has(ext)) allByExtId.set(ext, ex);
      if (ex.name && !allByName.has(ex.name.toLowerCase())) allByName.set(ex.name.toLowerCase(), ex);
    }

    console.log(`${results.length} results, +${allByExtId.size - startSize} new (total: ${allByExtId.size})`);
  }

  console.log('');
  console.log(`📊 Total unique by ext_id: ${allByExtId.size}`);
  console.log(`📊 Total unique by name:   ${allByName.size}`);
  console.log('');

  // Match SVG files
  function norm(s) {
    return String(s).toLowerCase().replace(/[\s_/-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  const results = [];
  let matched = 0;
  const unmatched = [];

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const n = norm(id);

    // Try multiple strategies
    let meta = allByExtId.get(id) ||
               allByName.get(id.toLowerCase());

    if (!meta) {
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
      source: 'worker-cursor-sync',
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

  if (unmatched.length > 0) {
    await fs.writeFile(
      path.join(__dirname, '..', 'public', 'unmatched-svg.json'),
      JSON.stringify(unmatched, null, 2),
      'utf8'
    );
    console.log(`⚠️  Unmatched list: server/public/unmatched-svg.json`);
  }
}

main().catch(e => { console.error('❌', e); process.exit(1); });

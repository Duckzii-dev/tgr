#!/usr/bin/env node
/**
 * Match 879 SVG files ↔ Anatome exercises.json.
 * File Anatome là ARRAY, mỗi item có `ext_id` khớp CHÍNH XÁC với tên file SVG.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANATOME_DATA = path.resolve(process.env.HOME, 'Code/anatome/api/data/exercises.json');
const MAPS_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[\s_/-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .trim();
}

async function main() {
  console.log('🚀 Map SVG ↔ Anatome metadata (by ext_id)');
  console.log('');

  const raw = await fs.readFile(ANATOME_DATA, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.error('❌ File phải là array');
    process.exit(1);
  }

  const exercises = data;
  console.log(`   Anatome: ${exercises.length} exercises`);
  console.log(`   Sample keys: ${Object.keys(exercises[0]).join(', ')}`);
  console.log('');

  // === Build map ===
  // Key 1: ext_id exact
  const byExtId = new Map();
  // Key 2: normalized ext_id
  const byExtIdNorm = new Map();
  // Key 3: normalized name
  const byNameNorm = new Map();

  for (const ex of exercises) {
    const extId = ex.ext_id || ex.extId || '';
    const name = ex.name || '';

    if (extId) {
      byExtId.set(extId, ex);
      const n = normalizeName(extId);
      if (n && !byExtIdNorm.has(n)) byExtIdNorm.set(n, ex);
    }
    if (name) {
      const n = normalizeName(name);
      if (n && !byNameNorm.has(n)) byNameNorm.set(n, ex);
    }
  }

  console.log(`   By ext_id:        ${byExtId.size}`);
  console.log(`   By ext_id norm:   ${byExtIdNorm.size}`);
  console.log(`   By name norm:     ${byNameNorm.size}`);
  console.log('');

  // === Match SVG files ===
  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter((f) => f.endsWith('.svg'));
  console.log(`   SVG files: ${svgFiles.length}`);
  console.log('');

  const results = [];
  let m1 = 0, m2 = 0, m3 = 0, unmatched = 0;
  const unmatchedList = [];

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const idNorm = normalizeName(id);

    // Match 1: ext_id exact
    let meta = byExtId.get(id);
    let how = meta ? 'ext_id_exact' : null;

    // Match 2: ext_id normalized
    if (!meta) {
      meta = byExtIdNorm.get(idNorm);
      how = meta ? 'ext_id_norm' : null;
    }

    // Match 3: name normalized
    if (!meta) {
      meta = byNameNorm.get(idNorm);
      how = meta ? 'name_norm' : null;
    }

    if (meta) {
      if (how === 'ext_id_exact') m1++;
      else if (how === 'ext_id_norm') m2++;
      else m3++;
    } else {
      unmatched++;
      unmatchedList.push(id);
    }

    results.push({
      id,
      name: meta?.name || id.replace(/_/g, ' '),
      extId: meta?.ext_id || null,
      primaryMuscles: meta?.primaryMuscles || [],
      secondaryMuscles: meta?.secondaryMuscles || [],
      muscleSlugs: meta?.anatome_primary_slugs || [],
      secondarySlugs: meta?.anatome_secondary_slugs || [],
      equipment: meta?.equipment || null,
      difficulty: meta?.level || null,
      category: meta?.category || null,
      mechanic: meta?.mechanic || null,
      force: meta?.force || null,
      instructions: meta?.instructions || [],
      svgPath: `/static/muscle-maps/${file}`,
      matched: !!meta,
      matchHow: how,
    });
  }

  console.log(`📊 Match ext_id exact:  ${m1}`);
  console.log(`📊 Match ext_id norm:   ${m2}`);
  console.log(`📊 Match name norm:     ${m3}`);
  console.log(`📊 Unmatched:           ${unmatched}`);
  console.log('');

  results.sort((a, b) => a.name.localeCompare(b.name));

  // Muscle distribution
  const byMuscle = {};
  for (const ex of results) {
    const groups = ex.muscleSlugs?.length
      ? ex.muscleSlugs
      : ex.primaryMuscles?.map(m => String(m).toLowerCase()) || [];
    for (const g of groups) {
      if (g) byMuscle[g] = (byMuscle[g] || 0) + 1;
    }
  }

  console.log('📈 Phân bố muscle slug:');
  for (const [slug, count] of Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`   ${slug.padEnd(25)} ${count}`);
  }
  console.log('');

  const output = {
    _meta: {
      source: 'anatome+svg',
      generatedAt: new Date().toISOString(),
      totalExercises: results.length,
      matched: m1 + m2 + m3,
      matchedExtIdExact: m1,
      matchedExtIdNorm: m2,
      matchedNameNorm: m3,
      unmatched,
    },
    exercises: results,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  const stats = await fs.stat(OUT_FILE);
  console.log(`✅ Wrote ${OUT_FILE} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log('');

  if (unmatchedList.length > 0) {
    console.log(`⚠️  ${unmatchedList.length} unmatched (first 30):`);
    unmatchedList.slice(0, 30).forEach(id => console.log(`   - ${id}`));
    console.log('');

    await fs.writeFile(
      path.join(__dirname, '..', 'public', 'unmatched-svg.json'),
      JSON.stringify(unmatchedList, null, 2),
      'utf8'
    );
    console.log(`   Full list: server/public/unmatched-svg.json`);
  }

  // Sample matched record
  const sample = results.find(r => r.matched);
  if (sample) {
    console.log('');
    console.log('📋 Sample matched record:');
    console.log(JSON.stringify({
      id: sample.id,
      name: sample.name,
      extId: sample.extId,
      primaryMuscles: sample.primaryMuscles,
      secondaryMuscles: sample.secondaryMuscles,
      muscleSlugs: sample.muscleSlugs,
      equipment: sample.equipment,
      difficulty: sample.difficulty,
      matchHow: sample.matchHow,
    }, null, 2));
  }
}

main().catch(e => {
  console.error('❌', e);
  process.exit(1);
});

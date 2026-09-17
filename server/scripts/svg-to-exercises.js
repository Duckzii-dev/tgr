#!/usr/bin/env node
/**
 * Đọc toàn bộ SVG trong server/public/muscle-maps/
 * → extract exercise name từ tên file
 * → extract muscle slugs từ SVG metadata (nếu có)
 * → sinh anatome-exercises.json
 *
 * Usage:
 *   node server/scripts/svg-to-exercises.js
 *   node server/scripts/svg-to-exercises.js --update-existing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPS_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

// Slug → display label
const MUSCLE_LABELS = {
  neck: 'Neck',
  traps: 'Traps',
  'front-delts': 'Front Delt',
  'side-delts': 'Side Delt',
  'rear-delts': 'Rear Delt',
  'upper-chest': 'Upper Chest',
  chest: 'Chest',
  lats: 'Lats',
  'middle-back': 'Middle Back',
  'lower-back': 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quadriceps: 'Quads',
  quads: 'Quads',
  hamstring: 'Hamstrings',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  // Anatome-specific slugs
  abductors: 'Abductors',
  adductors: 'Adductors',
  'hip-flexors': 'Hip Flexors',
  'lower-arms': 'Forearms',
  'upper-arms': 'Arms',
  'upper-back': 'Upper Back',
  'lower-legs': 'Calves',
  'upper-legs': 'Legs',
  gluteal: 'Glutes',
  quadriceps: 'Quads',
  'serratus-anterior': 'Serratus Anterior',
  // Fallback
  cardio: 'Cardio',
};

function labelFor(slug) {
  return MUSCLE_LABELS[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Convert filename slug thành display name.
 * Bench_Press.svg → "Bench Press"
 * 3_4_Sit-Up.svg → "3/4 Sit-Up"
 * Chin-up (biceps).svg → "Chin-up (biceps)"
 */
function slugToName(slug) {
  return slug
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Capitalize first letter of each word
    .split(' ')
    .map(w => {
      // Giữ số và special chars
      if (/^[0-9]/.test(w)) {
        // 3 4 Sit-Up → 3/4 Sit-Up
        return w;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

/**
 * Extract muscle slugs từ SVG.
 * Anatome SVG có comment hoặc <desc> ghi muscles.
 * Format: <!-- source: anatome.dev · exercise: X --> hoặc từ layers payload.
 */
function extractMusclesFromSvg(svgText) {
  const muscles = new Set();

  // Cách 1: Tìm comment metadata
  const commentMatch = svgText.match(/<!--\s*source:.*?-->/);
  // Không có muscle list trong comment

  // Cách 2: Tìm data-muscles attribute nếu có
  const dataMatch = svgText.match(/data-muscles="([^"]+)"/);
  if (dataMatch) {
    dataMatch[1].split(',').forEach(m => muscles.add(m.trim()));
  }

  // Cách 3: Tìm class hoặc id chứa muscle name
  const classMatches = svgText.matchAll(/class="([^"]*muscle[^"]*)"/g);
  // Không có muscle name cụ thể trong class

  // Cách 4: Tìm trong layer groups
  // Anatome SVG có id như "chest", "biceps", ...
  const idMatches = svgText.matchAll(/id="([a-z][a-z0-9-]*)"/g);
  for (const m of idMatches) {
    const id = m[1];
    if (MUSCLE_LABELS[id]) {
      muscles.add(id);
    }
  }

  return [...muscles];
}

/**
 * Extract primary muscles từ SVG bằng cách phân tích fill colors.
 * Anatome dùng:
 *   #DC2626 (đỏ) = primary
 *   #F59E0B (cam) = secondary
 */
function extractMusclesFromColors(svgText) {
  const primary = new Set();
  const secondary = new Set();

  // Tìm tất cả group elements với fill color
  // Format: <g fill="#DC2626"><path .../><path .../></g>
  // Hoặc từng path có fill

  // Regex tìm fill + class muscle nearby
  const groupRegex = /<g[^>]*fill="(#[0-9A-Fa-f]{6})"[^>]*>([\s\S]*?)<\/g>/g;
  let m;
  while ((m = groupRegex.exec(svgText))) {
    const color = m[1].toUpperCase();
    const content = m[2];
    // Extract muscle names từ id/class nếu có
    const ids = content.matchAll(/id="([a-z][a-z0-9-]*)"/g);
    for (const idMatch of ids) {
      const id = idMatch[1];
      if (MUSCLE_LABELS[id]) {
        if (color === '#DC2626') primary.add(id);
        else if (color === '#F59E0B') secondary.add(id);
      }
    }
  }

  return { primary: [...primary], secondary: [...secondary] };
}

async function main() {
  console.log('🚀 Sinh exercises từ SVG files');
  console.log(`   Source: ${MAPS_DIR}`);
  console.log(`   Output: ${OUT_FILE}`);
  console.log('');

  // List tất cả SVG files
  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter(f => f.endsWith('.svg'));

  console.log(`   Total SVG files: ${svgFiles.length}`);
  console.log('');

  const exercises = [];
  let processed = 0;

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const filePath = path.join(MAPS_DIR, file);

    try {
      const svgText = await fs.readFile(filePath, 'utf8');

      const name = slugToName(id);
      const muscles = extractMusclesFromSvg(svgText);
      const colorMuscles = extractMusclesFromColors(svgText);

      // Merge
      const primaryMuscles = [...new Set([...muscles, ...colorMuscles.primary])];
      const secondaryMuscles = colorMuscles.secondary.filter(m => !primaryMuscles.includes(m));

      // Fallback: nếu không extract được → dùng tên bài
      const finalPrimary = primaryMuscles.length > 0
        ? primaryMuscles.map(labelFor)
        : ['Unknown'];
      const finalSecondary = secondaryMuscles.map(labelFor);

      exercises.push({
        id,
        name,
        primaryMuscles: finalPrimary,
        secondaryMuscles: finalSecondary,
        muscleSlugs: primaryMuscles,
        secondarySlugs: secondaryMuscles,
        svgPath: `/static/muscle-maps/${file}`,
      });

      processed++;
      if (processed % 100 === 0) {
        process.stdout.write(`\r   Progress: ${processed}/${svgFiles.length}`);
      }
    } catch (e) {
      console.warn(`\n   ⚠️  ${file}: ${e.message}`);
    }
  }

  console.log('');
  console.log('');

  // Sort by name
  exercises.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    _meta: {
      source: 'svg-files',
      generatedAt: new Date().toISOString(),
      totalExercises: exercises.length,
      note: 'Generated from SVG filenames in muscle-maps/',
    },
    exercises,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  const stats = await fs.stat(OUT_FILE);

  console.log(`✅ Wrote ${OUT_FILE}`);
  console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`   Exercises: ${exercises.length}`);
  console.log('');

  // Stats
  const withMuscles = exercises.filter(e => e.muscleSlugs.length > 0).length;
  console.log(`📊 Exercises có muscle info: ${withMuscles}/${exercises.length}`);

  // Sample
  console.log('');
  console.log('📋 Sample 3 exercises:');
  for (const ex of exercises.slice(0, 3)) {
    console.log(`   ${ex.name}`);
    console.log(`     Primary: ${ex.primaryMuscles.join(', ')}`);
    console.log(`     SVG: ${ex.svgPath}`);
  }
}

main().catch(e => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});

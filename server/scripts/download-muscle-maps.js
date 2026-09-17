#!/usr/bin/env node
/**
 * Pre-download muscle maps từ Anatome → local SVG.
 * Chạy 1 lần. Sau đó client load từ /static/muscle-maps/{id}.svg
 *
 * Usage:
 *   node server/scripts/download-muscle-maps.js
 *   node server/scripts/download-muscle-maps.js --concurrency 5
 *   node server/scripts/download-muscle-maps.js --dry
 *   node server/scripts/download-muscle-maps.js --force
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.ANATOME_API || 'https://api.anatome.dev';
const EXERCISES_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');
const OUT_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');

const args = process.argv.slice(2);
const CONCURRENCY = (() => {
  const idx = args.indexOf('--concurrency');
  if (idx >= 0 && args[idx + 1]) return Math.max(1, Number(args[idx + 1]));
  return 3;
})();
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');

function slugifyId(id) {
  return String(id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function buildUrl(ex) {
  if (!ex?.layersPayload?.length) return null;
  const layers = ex.layersPayload
    .map((l) => {
      const color = (l.color || '#DC2626').replace('#', '');
      const muscles = (l.muscles || []).join('%2C');
      return `${color}:${muscles}`;
    })
    .join(',');
  return `${API_BASE}/generateImage?gender=male&view=dual&layers=${layers}&output=raw`;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadOne(ex, stats) {
  const slug = slugifyId(ex.id);
  const file = path.join(OUT_DIR, `${slug}.svg`);

  // Skip nếu đã có và không force
  if (!FORCE && (await fileExists(file))) {
    stats.exists++;
    return;
  }

  const url = buildUrl(ex);
  if (!url) {
    stats.skip++;
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      stats.fail++;
      console.warn(`\n   ⚠️  [${res.status}] ${ex.id}`);
      return;
    }
    const text = await res.text();
    if (!text.includes('<svg')) {
      stats.invalid++;
      console.warn(`\n   ⚠️  [invalid svg] ${ex.id}`);
      return;
    }
    if (!DRY) {
      // Thêm XML declaration + comment metadata
      const header = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- source: anatome.dev · exercise: ${ex.name} -->\n`;
      await fs.writeFile(file, header + text, 'utf8');
    }
    stats.ok++;
  } catch (e) {
    stats.error++;
    console.warn(`\n   ⚠️  [error] ${ex.id}: ${e.message}`);
  }
}

async function runWithConcurrency(items, concurrency, fn, stats) {
  const queue = [...items];
  let done = 0;
  const total = items.length;

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      await fn(item, stats);
      done++;
      if (done % 25 === 0 || done === total) {
        const pct = ((done / total) * 100).toFixed(1);
        process.stdout.write(
          `\r   Progress: ${done}/${total} (${pct}%) · ok=${stats.ok} exists=${stats.exists} fail=${stats.fail}`
        );
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log('');
}

async function main() {
  console.log('🚀 Pre-download muscle maps');
  console.log(`   Source: ${EXERCISES_FILE}`);
  console.log(`   Output: ${OUT_DIR}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  console.log(`   Dry run: ${DRY}`);
  console.log(`   Force: ${FORCE}`);
  console.log('');

  if (!(await fileExists(EXERCISES_FILE))) {
    console.error('❌ Missing anatome-exercises.json. Run sync script first:');
    console.error('   node server/scripts/sync-anatome-exercises.js');
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const raw = await fs.readFile(EXERCISES_FILE, 'utf8');
  const data = JSON.parse(raw);
  const exercises = data.exercises || [];

  const withLayers = exercises.filter((e) => e.layersPayload?.length);
  console.log(`   Total exercises: ${exercises.length}`);
  console.log(`   With layers: ${withLayers.length}`);
  console.log('');

  const stats = {
    ok: 0,
    exists: 0,
    skip: 0,
    fail: 0,
    invalid: 0,
    error: 0,
  };

  await runWithConcurrency(withLayers, CONCURRENCY, downloadOne, stats);

  console.log('');
  console.log('📊 Results:');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`   ${k.padEnd(10)} ${v}`);
  }

  const files = await fs.readdir(OUT_DIR);
  const svgFiles = files.filter((f) => f.endsWith('.svg'));
  let totalSize = 0;
  for (const f of svgFiles) {
    const stat = await fs.stat(path.join(OUT_DIR, f));
    totalSize += stat.size;
  }
  console.log('');
  console.log(`📦 Total SVG files: ${svgFiles.length}`);
  console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('🎉 Done.');
  console.log('');
  console.log('Next steps:');
  console.log('  git add server/scripts/download-muscle-maps.js');
  console.log('  git add server/public/muscle-maps/');
  console.log('  git commit -m "Pre-download muscle maps"');
  console.log('  git push');
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});

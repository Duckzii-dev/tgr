#!/usr/bin/env node
/**
 * Detailed muscle classification v8.
 * - Word boundary check
 * - Negative keywords (VD: "trap bar" không phải traps)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPS_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

const LABELS = {
  neck: 'Neck', traps: 'Traps',
  'front-delts': 'Front Delt', 'side-delts': 'Side Delt', 'rear-delts': 'Rear Delt',
  'upper-chest': 'Upper Chest', chest: 'Chest',
  lats: 'Lats', 'middle-back': 'Middle Back', 'lower-back': 'Lower Back',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  abs: 'Abs', obliques: 'Obliques',
  glutes: 'Glutes', quadriceps: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
  mobility: 'Mobility', cardio: 'Cardio', other: 'Other',
};
function labelFor(slug) { return LABELS[slug] || slug; }

function stripSuffixes(id) {
  let s = id;
  s = s.replace(/_\d{3,}$/, '');
  s = s.replace(/_v_?\d+$/i, '');
  s = s.replace(/_(male|female)$/i, '');
  s = s.replace(/_\d{3,}_(male|female)$/i, '');
  s = s.replace(/\s+\d{3,}$/, '');
  return s;
}

// ============================================================
// NEGATIVE KEYWORDS
// Nếu tên chứa các cụm này, KHÔNG match rule tương ứng
// ============================================================
const NEGATIVE = {
  traps: ['trap bar', 'trap-bar', 'trapbar'],  // trap bar ≠ traps
  // Thêm negative khác nếu cần
};

/**
 * Match với word boundary — tránh match substring.
 * "trap" không match "trap bar" nếu negative.
 */
function matchesWithBoundary(lower, kw, negativeList = []) {
  const kwLower = kw.replace(/_/g, ' ');

  // Nếu tên chứa negative → không match
  for (const neg of negativeList) {
    if (lower.includes(neg)) return false;
  }

  // Word boundary: kw phải đứng độc lập hoặc có ranh giới
  // VD: "trap" match "trap" hoặc "trap-" nhưng không match "trapbar"
  const idx = lower.indexOf(kwLower);
  if (idx === -1) return false;

  const before = idx === 0 ? ' ' : lower[idx - 1];
  const afterIdx = idx + kwLower.length;
  const after = afterIdx >= lower.length ? ' ' : lower[afterIdx];

  // Word boundary: ký tự trước/sau phải là space hoặc dấu phân cách
  const isBoundary = (c) => c === ' ' || c === '-' || c === ',' || c === '';

  return isBoundary(before) && isBoundary(after);
}

/**
 * Match đơn giản (substring) — cho các keyword dài, đặc trưng.
 */
function matchesSimple(lower, kw) {
  return lower.includes(kw.replace(/_/g, ' '));
}

const RULES = [
  // 1. STRETCH
  { kw: ['stretch', 'mobility', 'foam roll', 'cat cow', 'downward dog',
         'pigeon', 'hip opener', 'shoulder dislocate', 'sun salutation',
         'world greatest', 'dynamic warm', 'warm up', 'cossack',
         '90 90', 'deep squat hold', 'pose', 'yoga', 'reclining',
         'big toe pose', 'sleeper stretch'],
    slugs: ['mobility'], bp: 'stretch', boundary: false },

  // 2. FOREARMS
  { kw: ['wrist curl', 'wrist extension', 'reverse wrist',
         'wrist extensor', 'wrist flexor'],
    slugs: ['forearms'], bp: 'forearms', boundary: false },
  { kw: ['wrist'], slugs: ['forearms'], bp: 'forearms', boundary: true },
  { kw: ['farmer walk', 'farmer carry', 'farmers walk',
         'plate pinch', 'hand grip'],
    slugs: ['forearms'], bp: 'forearms', boundary: false },

  // 3. BICEPS
  { kw: ['curl', 'bicep', 'biceps', 'zottman', '21s'],
    slugs: ['biceps'], bp: 'biceps', boundary: true },

  // 4. TRICEPS
  { kw: ['tricep', 'triceps', 'skull crusher', 'skullcrusher',
         'pushdown', 'push down', 'kickback', 'overhead extension',
         'bench dip', 'diamond pushup', 'jm press', 'tate press',
         'lying extension', 'french press', 'concentration extension',
         'cable extension', 'seated extension', 'standing one arm extension',
         'incline two arm extension', 'close grip press', 'close grip bench',
         'close grip to skull', 'tricep extension'],
    slugs: ['triceps'], bp: 'triceps', boundary: false },

  // 5. NECK
  { kw: ['neck', 'head turn', 'head tilt'],
    slugs: ['neck'], bp: 'shoulders', boundary: true },

  // 6. TRAPS — có negative "trap bar"
  { kw: ['shrug', 'trap', 'upright row', 'face pull',
         'y raise', 'y-raise', 'band pull apart'],
    slugs: ['traps'], bp: 'back', boundary: true,
    negative: ['trap bar', 'trap-bar', 'trapbar'] },

  // 7. REAR DELTS
  { kw: ['reverse fly', 'reverse-fly', 'rear delt fly', 'rear delt raise',
         'bent over lateral raise', 'lying one arm deltoid rear'],
    slugs: ['rear-delts'], bp: 'shoulders', boundary: false },

  // 8. FRONT DELTS
  { kw: ['front raise', 'forward raise'],
    slugs: ['front-delts'], bp: 'shoulders', boundary: false },

  // 9. SIDE DELTS
  { kw: ['lateral raise', 'side delt', 'side lateral'],
    slugs: ['side-delts'], bp: 'shoulders', boundary: false },

  // 10. SHOULDERS chung
  { kw: ['shoulder press', 'overhead press', 'military press',
         'arnold press', 'delt raise', 'plate raise', 'landmine press',
         'pike press', 'shoulder raise', 'bradford press', 'bradford rock',
         'slinger', 'arm slinger', 'push press', 'dumbbell push press',
         'shoulder external rotation', 'shoulder internal rotation',
         'external shoulder rotation', 'internal shoulder rotation',
         'seated alternate shoulder', 'alternate shoulder',
         'incline raise', 'incline t raise', 't raise',
         'shoulder flexor', 'side press', 'alternate side press',
         'overhead reach', 'shoulder'],
    slugs: ['front-delts', 'side-delts'], bp: 'shoulders', boundary: true },

  // 11. UPPER CHEST
  { kw: ['incline bench', 'incline press', 'incline dumbbell', 'incline fly',
         'upper chest', 'low to high cable fly', 'low cable fly'],
    slugs: ['upper-chest'], bp: 'chest', boundary: false },

  // 12. CHEST
  { kw: ['bench press', 'chest press', 'pec deck', 'chest fly',
         'cable fly', 'crossover', 'cross over', 'cross-over',
         'decline press', 'decline fly', 'dumbbell fly', 'machine fly',
         'pushup', 'push up', 'push-up', 'svend press', 'butterfly',
         'floor press', 'pin press', 'reverse grip press', 'wide grip press',
         'hammer press', 'bench seated press', 'chest squeeze',
         'isometric chest', 'dumbbell bench seated',
         'chest pass', 'chest push', 'medicine ball chest',
         'high to low cable fly', 'middle cable fly'],
    slugs: ['chest'], bp: 'chest', boundary: false },
  { kw: ['chest'], slugs: ['chest'], bp: 'chest', boundary: true },
  { kw: ['dip'], slugs: ['chest', 'triceps'], bp: 'chest', boundary: true },

  // 13. LATS
  { kw: ['pullup', 'pull-up', 'pull up', 'pulldown', 'pull down',
         'lat pull', 'lat pulldown', 'chin up', 'chinup', 'chin-up',
         'lat pullover', 'straight arm pulldown'],
    slugs: ['lats'], bp: 'back', boundary: false },
  { kw: ['lat'], slugs: ['lats'], bp: 'back', boundary: true },

  // 14. MIDDLE BACK
  { kw: ['row', 't bar', 'tbar', 'seated row', 'inverted row',
         'cable row', 'barbell row', 'dumbbell row', 'machine row',
         'cable twisting pull', 'judo flip', 'middle back'],
    slugs: ['middle-back'], bp: 'back', boundary: true },

  // 15. LOWER BACK — có "deadlift" ưu tiên hơn traps
  { kw: ['deadlift', 'dead lift', 'back extension', 'hyperextension',
         'reverse hyper', 'good morning', 'rack pull',
         'clean and press', 'power clean', 'hang clean', 'lower back',
         'erector'],
    slugs: ['lower-back'], bp: 'back', boundary: false },

  // 16. OLY
  { kw: ['snatch', 'jerk', 'clean'],
    slugs: ['quadriceps', 'hamstrings', 'lower-back'], bp: 'legs', boundary: true },

  // 17. BACK chung
  { kw: ['pullover', 'bent arm pullover'],
    slugs: ['lats', 'middle-back'], bp: 'back', boundary: false },

  // 18. OBLIQUES
  { kw: ['oblique', 'side bend', 'wood chop', 'side plank', 'side crunch',
         'russian twist'],
    slugs: ['obliques'], bp: 'core', boundary: false },

  // 19. ABS
  { kw: ['crunch', 'sit up', 'situp', 'sit-up', 'plank', 'leg raise',
         'knee raise', 'hanging leg', 'hanging knee', 'hanging',
         'ab wheel', 'ab roller', 'jackknife',
         'v up', 'bicycle', 'toe touch', 'dead bug', 'bird dog',
         'hollow hold', 'hollow body', 'mountain climber',
         'flutter kick', 'scissor', 'copenhagen',
         'rollout', 'roll out', 'rollerout', 'l sit', 'front lever',
         'back lever', 'dragon flag', 'pallof', 'carry', 'overhead carry',
         'suitcase carry', 'farmers carry', 'hug knee', 'hug keens',
         'leg pull in', 'pull in', 'shoulder tap'],
    slugs: ['abs'], bp: 'core', boundary: false },
  { kw: ['abs', 'core'], slugs: ['abs'], bp: 'core', boundary: true },

  // 20. GLUTES
  { kw: ['hip thrust', 'glute', 'hip abduction', 'hip adduction',
         'hip extension', 'donkey kick', 'fire hydrant', 'clamshell',
         'pull through', 'glute bridge'],
    slugs: ['glutes'], bp: 'legs', boundary: false },

  // 21. HAMSTRINGS
  { kw: ['romanian deadlift', 'romanian', 'rdl', 'stiff leg', 'stiff legged',
         'leg curl', 'lying leg curl', 'seated leg curl', 'hamstring',
         'nordic curl'],
    slugs: ['hamstrings'], bp: 'legs', boundary: false },

  // 22. CALVES
  { kw: ['calf raise', 'calf press', 'calf', 'calves', 'donkey calf',
         'seated calf', 'standing calf'],
    slugs: ['calves'], bp: 'legs', boundary: true },

  // 23. QUADS
  { kw: ['squat', 'leg extension', 'leg press', 'lunge', 'step up',
         'step-up', 'pistol', 'bulgarian', 'goblet', 'hack squat',
         'sissy squat', 'front squat', 'back squat', 'jump squat',
         'split squat', 'duck walk', 'curtsy lunge', 'walking lunge',
         'reverse lunge', 'zercher', 'box squat', 'quad', 'leg kickback'],
    slugs: ['quadriceps'], bp: 'legs', boundary: true },

  // 24. LEGS chung
  { kw: ['thruster', 'hip hinge', 'lower body', 'single leg'],
    slugs: ['quadriceps', 'hamstrings'], bp: 'legs', boundary: false },
  { kw: ['leg'], slugs: ['quadriceps', 'hamstrings'], bp: 'legs', boundary: true },

  // 25. CARDIO
  { kw: ['treadmill', 'bike', 'cycling', 'rowing machine', 'rope wave',
         'battle rope', 'battling rope', 'jump rope', 'burpee', 'sprint',
         'stepmill', 'elliptical', 'air bike', 'high knees', 'jumping jack',
         'box jump', 'jump', 'skip', 'hop', 'run', 'jog', 'walk', 'stair',
         'skierg', 'assault bike', 'spin bike', 'astride', 'march',
         'back and forth step', 'sledge', 'sledgehammer', 'rope climb',
         'medicine ball slam', 'overhead slam'],
    slugs: ['cardio'], bp: 'cardio', boundary: true },
];

function classifyByFilename(id) {
  const cleaned = stripSuffixes(id);
  const lower = cleaned.toLowerCase().replace(/[_-]+/g, ' ');

  for (const rule of RULES) {
    for (const kw of rule.kw) {
      const matched = rule.boundary
        ? matchesWithBoundary(lower, kw, rule.negative || [])
        : matchesSimple(lower, kw);
      if (matched) {
        return { slugs: rule.slugs, bodyPart: rule.bp };
      }
    }
  }
  return { slugs: ['other'], bodyPart: 'other' };
}

async function main() {
  console.log('🚀 Classify v8');

  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter(f => f.endsWith('.svg'));

  const results = [];
  const byGroup = {};
  const bySlug = {};

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const displayName = stripSuffixes(id).replace(/_/g, ' ');
    const cls = classifyByFilename(id);

    byGroup[cls.bodyPart] = (byGroup[cls.bodyPart] || 0) + 1;
    for (const slug of cls.slugs) {
      bySlug[slug] = (bySlug[slug] || 0) + 1;
    }

    results.push({
      id,
      name: displayName,
      bodyPart: cls.bodyPart,
      muscleSlugs: cls.slugs,
      primaryMuscles: cls.slugs.map(labelFor),
      secondaryMuscles: [],
      secondarySlugs: [],
      svgPath: `/static/muscle-maps/${file}`,
      matched: true,
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));

  console.log('');
  console.log('📈 BodyPart:');
  for (const [bp, count] of Object.entries(byGroup).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${bp.padEnd(20)} ${count}`);
  }
  console.log('');
  console.log('💪 Muscle slug:');
  for (const [slug, count] of Object.entries(bySlug).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${slug.padEnd(20)} ${count}`);
  }

  const output = {
    _meta: {
      source: 'detailed-classification-v8',
      generatedAt: new Date().toISOString(),
      totalExercises: results.length,
      byGroup, bySlug,
    },
    exercises: results,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log('');
  console.log(`✅ Wrote ${OUT_FILE}`);

  // Verify trap bar deadlift
  const trapBar = results.find(r => r.id.includes('Trap_Bar_Deadlift'));
  if (trapBar) {
    console.log('');
    console.log('📋 Trap Bar Deadlift:');
    console.log(`   bodyPart: ${trapBar.bodyPart}`);
    console.log(`   muscleSlugs: ${trapBar.muscleSlugs.join(', ')}`);
  }
}

main().catch(e => { console.error('❌', e); process.exit(1); });

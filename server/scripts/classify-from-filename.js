#!/usr/bin/env node
/**
 * Detailed muscle classification v6.
 * Rule order: SPECIFIC FIRST (abs/obliques → traps/rear-delt → others).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPS_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

const LABELS = {
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
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  mobility: 'Mobility',
  cardio: 'Cardio',
  other: 'Other',
};
function labelFor(slug) { return LABELS[slug] || slug; }

// ============================================================
// RULES — ORDER: MOST SPECIFIC FIRST
// ============================================================
const RULES = [
  // ========== 1. STRETCH (nhất định trước) ==========
  { kw: ['stretch', 'mobility', 'foam roll', 'cat cow', 'downward dog',
         'pigeon', 'hip opener', 'shoulder dislocate', 'sun salutation',
         'world greatest', 'dynamic warm', 'warm up', 'cossack',
         '90 90', 'deep squat hold', 'pose', 'yoga', 'reclining',
         'big toe pose', 'sleeper stretch', 'pigeon pose',
         'butterfly pose', 'cobra stretch', 'child pose'],
    slugs: ['mobility'], bp: 'stretch' },

  // ========== 2. FOREARMS ==========
  { kw: ['wrist curl', 'wrist extension', 'reverse wrist curl',
         'wrist extensor', 'wrist flexor', 'reverse wrist',
         'farmer walk', 'farmer carry', 'farmers walk', 'plate pinch',
         'hand grip', 'wrist'],
    slugs: ['forearms'], bp: 'forearms' },

  // ========== 3. NECK ==========
  { kw: ['neck', 'head turn', 'head tilt', 'neck flexion', 'neck extension'],
    slugs: ['neck'], bp: 'shoulders' },

  // ========== 4. TRAPS ==========
  { kw: ['shrug', 'trap', 'upright row', 'face pull',
         'y raise', 'y-raise', 'band pull apart'],
    slugs: ['traps'], bp: 'back' },

  // ========== 5. REAR DELTS ==========
  { kw: ['reverse fly', 'reverse-fly', 'rear delt fly', 'rear delt raise',
         'bent over lateral raise', 'lying one arm deltoid rear'],
    slugs: ['rear-delts'], bp: 'shoulders' },

  // ========== 6. FRONT DELTS ==========
  { kw: ['front raise', 'forward raise'],
    slugs: ['front-delts'], bp: 'shoulders' },

  // ========== 7. SIDE DELTS ==========
  { kw: ['lateral raise', 'side delt', 'side lateral'],
    slugs: ['side-delts'], bp: 'shoulders' },

  // ========== 8. SHOULDERS (chung) ==========
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
    slugs: ['front-delts', 'side-delts'], bp: 'shoulders' },

  // ========== 9. UPPER CHEST ==========
  { kw: ['incline bench', 'incline press', 'incline dumbbell', 'incline fly',
         'upper chest', 'low to high cable fly', 'low cable fly'],
    slugs: ['upper-chest'], bp: 'chest' },

  // ========== 10. CHEST ==========
  { kw: ['bench press', 'chest press', 'pec deck', 'chest fly',
         'cable fly', 'crossover', 'cross over', 'cross-over',
         'decline press', 'decline fly', 'dumbbell fly', 'machine fly',
         'pushup', 'push up', 'push-up', 'svend press', 'butterfly',
         'floor press', 'pin press', 'reverse grip press', 'wide grip press',
         'hammer press', 'bench seated press', 'chest squeeze',
         'isometric chest', 'dumbbell bench seated',
         'chest pass', 'chest push', 'medicine ball chest',
         'high to low cable fly', 'middle cable fly', 'chest'],
    slugs: ['chest'], bp: 'chest' },

  { kw: ['dip'], slugs: ['chest', 'triceps'], bp: 'chest' },

  // ========== 11. LATS ==========
  { kw: ['pullup', 'pull-up', 'pull up', 'pulldown', 'pull down',
         'lat pull', 'lat pulldown', 'chin up', 'chinup', 'chin-up',
         'lat pullover', 'straight arm pulldown', 'lat'],
    slugs: ['lats'], bp: 'back' },

  // ========== 12. MIDDLE BACK ==========
  { kw: ['row', 't bar', 'tbar', 'seated row', 'inverted row',
         'cable row', 'barbell row', 'dumbbell row', 'machine row',
         'cable twisting pull', 'judo flip', 'middle back'],
    slugs: ['middle-back'], bp: 'back' },

  // ========== 13. LOWER BACK ==========
  { kw: ['deadlift', 'dead lift', 'back extension', 'hyperextension',
         'reverse hyper', 'good morning', 'rack pull',
         'clean and press', 'power clean', 'hang clean', 'lower back',
         'erector'],
    slugs: ['lower-back'], bp: 'back' },

  // ========== 14. CLEAN/SNATCH/JERK ==========
  { kw: ['snatch', 'jerk', 'clean'],
    slugs: ['quadriceps', 'hamstrings', 'lower-back'], bp: 'legs' },

  // ========== 15. BACK chung ==========
  { kw: ['pullover', 'bent arm pullover'],
    slugs: ['lats', 'middle-back'], bp: 'back' },

  // ========== 16. BICEPS ==========
  { kw: ['curl', 'bicep', 'biceps', 'zottman', '21s'],
    slugs: ['biceps'], bp: 'biceps' },

  // ========== 17. TRICEPS ==========
  { kw: ['tricep', 'triceps', 'skull crusher', 'skullcrusher', 'skull',
         'pushdown', 'kickback', 'overhead extension', 'bench dip',
         'diamond pushup', 'jm press', 'tate press', 'lying extension',
         'french press', 'concentration extension', 'cable extension',
         'seated extension', 'standing one arm extension',
         'incline two arm extension', 'close grip press', 'close grip bench',
         'close grip to skull', 'tricep extension'],
    slugs: ['triceps'], bp: 'triceps' },

  // ========== 18. OBLIQUES ==========
  { kw: ['oblique', 'side bend', 'wood chop', 'side plank', 'side crunch',
         'russian twist'],
    slugs: ['obliques'], bp: 'core' },

  // ========== 19. ABS (trước legs để bắt "leg raise" abs) ==========
  { kw: ['crunch', 'sit up', 'situp', 'sit-up', 'plank', 'leg raise',
         'knee raise', 'hanging leg', 'hanging knee', 'hanging',
         'ab wheel', 'ab roller', 'jackknife',
         'v up', 'bicycle', 'toe touch', 'dead bug', 'bird dog',
         'hollow hold', 'hollow body', 'mountain climber',
         'flutter kick', 'scissor', 'copenhagen',
         'rollout', 'roll out', 'rollerout', 'l sit', 'front lever',
         'back lever', 'dragon flag', 'pallof', 'carry', 'overhead carry',
         'suitcase carry', 'farmers carry', 'hug knee', 'hug keens',
         'leg pull in', 'pull in', 'shoulder tap', 'abs', 'core'],
    slugs: ['abs'], bp: 'core' },

  // ========== 20. GLUTES ==========
  { kw: ['hip thrust', 'glute', 'hip abduction', 'hip adduction',
         'hip extension', 'donkey kick', 'fire hydrant', 'clamshell',
         'pull through', 'glute bridge'],
    slugs: ['glutes'], bp: 'legs' },

  // ========== 21. HAMSTRINGS ==========
  { kw: ['romanian deadlift', 'romanian', 'rdl', 'stiff leg', 'stiff legged',
         'leg curl', 'lying leg curl', 'seated leg curl', 'hamstring',
         'nordic curl'],
    slugs: ['hamstrings'], bp: 'legs' },

  // ========== 22. CALVES (trước quads để bắt "calf") ==========
  { kw: ['calf raise', 'calf press', 'calf', 'calves', 'donkey calf',
         'seated calf', 'standing calf'],
    slugs: ['calves'], bp: 'legs' },

  // ========== 23. QUADS ==========
  { kw: ['squat', 'leg extension', 'leg press', 'lunge', 'step up',
         'step-up', 'pistol', 'bulgarian', 'goblet', 'hack squat',
         'sissy squat', 'front squat', 'back squat', 'jump squat',
         'split squat', 'duck walk', 'curtsy lunge', 'walking lunge',
         'reverse lunge', 'zercher', 'box squat', 'quad', 'leg kickback'],
    slugs: ['quadriceps'], bp: 'legs' },

  // ========== 24. LEGS chung ==========
  { kw: ['thruster', 'hip hinge', 'lower body', 'single leg', 'leg'],
    slugs: ['quadriceps', 'hamstrings'], bp: 'legs' },

  // ========== 25. CARDIO ==========
  { kw: ['treadmill', 'bike', 'cycling', 'rowing machine', 'rope wave',
         'battle rope', 'battling rope', 'jump rope', 'burpee', 'sprint',
         'stepmill', 'elliptical', 'air bike', 'high knees', 'jumping jack',
         'box jump', 'jump', 'skip', 'hop', 'run', 'jog', 'walk', 'stair',
         'skierg', 'assault bike', 'spin bike', 'astride', 'march',
         'back and forth step', 'sledge', 'sledgehammer', 'rope climb',
         'medicine ball slam', 'overhead slam'],
    slugs: ['cardio'], bp: 'cardio' },
];

function classifyByFilename(id) {
  const lower = id.toLowerCase().replace(/[_-]+/g, ' ');
  for (const rule of RULES) {
    for (const kw of rule.kw) {
      const kwLower = kw.replace(/_/g, ' ');
      if (lower.includes(kwLower)) {
        return { slugs: rule.slugs, bodyPart: rule.bp };
      }
    }
  }
  return { slugs: ['other'], bodyPart: 'other' };
}

async function main() {
  console.log('🚀 Classify v6 (ordered)');

  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter(f => f.endsWith('.svg'));

  const results = [];
  const byGroup = {};
  const bySlug = {};

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const displayName = id.replace(/_/g, ' ');
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
      source: 'detailed-classification-v6',
      generatedAt: new Date().toISOString(),
      totalExercises: results.length,
      byGroup,
      bySlug,
    },
    exercises: results,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log('');
  console.log(`✅ Wrote ${OUT_FILE}`);

  // Verify Assisted Hanging Knee Raise
  const check = results.find(r => r.id === 'Assisted_Hanging_Knee_Raise_With_Throw_Down');
  if (check) {
    console.log('');
    console.log('📋 Check "Assisted Hanging Knee Raise":');
    console.log(`   bodyPart: ${check.bodyPart}`);
    console.log(`   muscleSlugs: ${check.muscleSlugs.join(', ')}`);
  }
}

main().catch(e => { console.error('❌', e); process.exit(1); });

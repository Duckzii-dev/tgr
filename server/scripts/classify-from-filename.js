#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPS_DIR = path.join(__dirname, '..', 'public', 'muscle-maps');
const OUT_FILE = path.join(__dirname, '..', 'public', 'anatome-exercises.json');

const RULES = [
  // ============================================================
  // STRETCH (ưu tiên cao)
  // ============================================================
  { kw: ['stretch', 'mobility', 'foam roll', 'cat cow', 'downward dog', 'pigeon',
         'hip opener', 'shoulder dislocate', 'sun salutation', 'world greatest',
         'dynamic warm', 'warm up', 'cossack', '90 90', 'deep squat hold',
         'pose', 'yoga', 'reclining', 'big toe pose'],
    m: ['mobility'], bp: 'stretch' },

  // ============================================================
  // FOREARMS
  // ============================================================
  { kw: ['wrist curl', 'wrist extension', 'reverse wrist', 'farmer', 'farmers walk',
         'dead hang', 'plate pinch', 'hand grip'],
    m: ['forearms'], bp: 'forearms' },

  // ============================================================
  // CARDIO
  // ============================================================
  { kw: ['treadmill', 'bike', 'cycling', 'rowing machine', 'rope wave', 'battle rope',
         'battling rope', 'jump rope', 'burpee', 'sprint', 'stepmill', 'elliptical',
         'air bike', 'high knees', 'jumping jack', 'box jump', 'jump', 'skip', 'hop',
         'run', 'jog', 'walk', 'stair', 'skierg', 'assault bike', 'spin bike',
         'astride', 'march', 'back and forth step', 'sledge', 'sledgehammer',
         'rope climb', 'medicine ball slam', 'overhead slam'],
    m: ['cardio'], bp: 'cardio' },

  // ============================================================
  // CORE
  // ============================================================
  { kw: ['crunch', 'sit up', 'situp', 'plank', 'leg raise', 'knee raise',
         'russian twist', 'ab wheel', 'ab roller', 'jackknife', 'hanging leg',
         'hanging knee', 'oblique', 'v up', 'bicycle', 'toe touch', 'dead bug',
         'bird dog', 'hollow hold', 'hollow body', 'mountain climber', 'flutter kick',
         'scissor', 'wood chop', 'side bend', 'copenhagen', 'rollout', 'roll out',
         'rollerout', 'lever', 'l sit', 'front lever', 'back lever', 'dragon flag',
         'pallof', 'carry', 'overhead carry', 'suitcase carry', 'farmers carry',
         'body rotation', 'lower body rotation', 'hug knee', 'hug keens',
         'leg pull in', 'pull in', 'medicine ball overhead',
         'shoulder tap', 'single leg platform slide', 'platform slide'],
    m: ['abs'], bp: 'core' },

  // ============================================================
  // BICEPS (match mọi "curl")
  // ============================================================
  { kw: ['curl', 'bicep', 'biceps', 'zottman', '21s'],
    m: ['biceps'], bp: 'biceps' },

  // ============================================================
  // TRICEPS (match "skull", "skullcrusher", "tricep", "pushdown" ...)
  // ============================================================
  { kw: ['tricep', 'triceps', 'skull crusher', 'skullcrusher', 'skull',
         'pushdown', 'kickback', 'overhead extension', 'bench dip',
         'diamond pushup', 'jm press', 'tate press', 'lying extension',
         'french press', 'concentration extension', 'cable extension',
         'seated extension', 'lying alternate extension', 'lying single extension',
         'standing one arm extension', 'seated bench extension',
         'incline two arm extension', 'close grip press', 'close grip bench',
         'close grip to skull'],
    m: ['triceps'], bp: 'triceps' },

  // ============================================================
  // SHOULDERS (match "raise", "rotation", "shoulder flexor" ...)
  // ============================================================
  { kw: ['shoulder press', 'overhead press', 'military press', 'lateral raise',
         'front raise', 'forward raise', 'rear delt', 'upright row',
         'arnold press', 'delt raise', 'delt rear', 'y raise', 'plate raise',
         'landmine press', 'pike press', 'shoulder raise', 'bradford press',
         'bradford rock', 'slinger', 'arm slinger', 'reverse fly', 'reverse-fly',
         'band pull apart', 'push press', 'dumbbell push press',
         'shoulder external rotation', 'shoulder internal rotation',
         'external shoulder rotation', 'internal shoulder rotation',
         'seated alternate shoulder', 'alternate shoulder',
         'incline raise', 'incline t raise', 't raise',
         'rear fly', 'lying one arm deltoid rear',
         'shoulder flexor', 'flexor depresor',
         'side press', 'alternate side press',
         'posterior step to overhead', 'overhead reach'],
    m: ['shoulders'], bp: 'shoulders' },

  // ============================================================
  // CHEST (match "fly", "press", "medicine ball chest")
  // ============================================================
  { kw: ['bench press', 'chest press', 'pec deck', 'chest fly',
         'fly', 'crossover', 'cross over', 'cross-over',
         'pushup', 'push up', 'svend press', 'butterfly',
         'decline press', 'incline press', 'floor press', 'pin press',
         'reverse grip press', 'wide grip press',
         'hammer press', 'bench seated press', 'chest squeeze',
         'isometric chest', 'dumbbell bench seated',
         'one arm press', 'decline one arm press', 'press on exercise ball',
         'chest pass', 'chest push', 'medicine ball chest',
         'push and pull bodyweight'],
    m: ['chest'], bp: 'chest' },

  { kw: ['dip'], m: ['chest', 'triceps'], bp: 'chest' },

  // ============================================================
  // BACK (match "hyper", "pull", "row", "deadlift" ...)
  // ============================================================
  { kw: ['deadlift', 'row', 'pullup', 'pull up', 'pulldown', 'pull down', 'shrug',
         'lat pull', 'back extension', 'face pull', 'chin up', 'chinup',
         'pullover', 'bent arm pullover', 't bar', 'tbar', 'seated row', 'bent over',
         'renegade', 'inverted row', 'rack pull', 'clean and press', 'power clean',
         'hang clean', 'clean', 'snatch', 'jerk', 'judo flip', 'twisting pull',
         'twisting', 'twist pull',
         'reverse hyper', 'hyper'],
    m: ['back'], bp: 'back' },

  // ============================================================
  // LEGS
  // ============================================================
  { kw: ['squat', 'lunge', 'leg press', 'leg extension', 'leg curl',
         'calf raise', 'calf press', 'hip thrust', 'romanian', 'rdl',
         'stiff leg', 'stiff legged', 'glute', 'hamstring', 'quad',
         'step up', 'pistol', 'bulgarian', 'goblet', 'hip abduction',
         'hip adduction', 'hip extension', 'hack squat', 'sissy squat',
         'front squat', 'back squat', 'jump squat', 'split squat',
         'duck walk', 'curtsy lunge', 'walking lunge', 'reverse lunge',
         'zercher', 'box squat', 'leg kickback', 'donkey kick',
         'fire hydrant', 'clamshell', 'pull through', 'good morning',
         'thruster', 'hip hinge',
         'single leg platform slide'],
    m: ['legs'], bp: 'legs' },
];

function classifyByFilename(id) {
  const lower = id.toLowerCase().replace(/[_-]+/g, ' ');

  for (const rule of RULES) {
    for (const kw of rule.kw) {
      const kwLower = kw.replace(/_/g, ' ');
      if (lower.includes(kwLower)) {
        return { muscles: rule.m, bodyPart: rule.bp };
      }
    }
  }

  return { muscles: ['other'], bodyPart: 'other' };
}

async function main() {
  console.log('🚀 Classify v5 (final)');

  const files = await fs.readdir(MAPS_DIR);
  const svgFiles = files.filter(f => f.endsWith('.svg'));

  const results = [];
  const byGroup = {};
  const otherList = [];

  for (const file of svgFiles) {
    const id = file.replace('.svg', '');
    const displayName = id.replace(/_/g, ' ');
    const cls = classifyByFilename(id);
    byGroup[cls.bodyPart] = (byGroup[cls.bodyPart] || 0) + 1;

    if (cls.bodyPart === 'other') otherList.push(id);

    results.push({
      id,
      name: displayName,
      primaryMuscles: cls.muscles,
      secondaryMuscles: [],
      muscleSlugs: cls.muscles,
      secondarySlugs: [],
      bodyPart: cls.bodyPart,
      svgPath: `/static/muscle-maps/${file}`,
      matched: true,
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));

  console.log('');
  console.log('📈 Phân bố:');
  for (const [bp, count] of Object.entries(byGroup).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${bp.padEnd(20)} ${count}`);
  }
  console.log('');

  if (otherList.length > 0) {
    console.log(`⚠️  ${otherList.length} bài "other":`);
    otherList.forEach(id => console.log(`   - ${id}`));
  } else {
    console.log('✅ Không còn bài "other" nào!');
  }

  const output = {
    _meta: {
      source: 'filename-classification-v5',
      generatedAt: new Date().toISOString(),
      totalExercises: results.length,
      byGroup,
    },
    exercises: results,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Wrote ${OUT_FILE}`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });

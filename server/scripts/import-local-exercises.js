import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const JSON_FILE = path.join(__dirname, '..', 'public', 'exercises.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');

const TARGET_MUSCLE_MAP = {
  // chest
  'pectoralis major clavicular head': 'upper chest',
  'pectoralis major sternal head': 'mid chest',
  'pectoralis major': 'chest',
  'pectoralis minor': 'chest',
  // back
  'latissimus dorsi': 'lats',
  'trapezius upper fibers': 'upper traps',
  'trapezius middle fibers': 'mid traps',
  'trapezius lower fibers': 'lower traps',
  'trapezius': 'traps',
  'rhomboids': 'rhomboids',
  'teres major': 'teres major',
  'teres minor': 'teres minor',
  'erector spinae': 'lower back',
  'infraspinatus': 'rotator cuff',
  'subscapularis': 'rotator cuff',
  // shoulders
  'anterior deltoid': 'front delts',
  'lateral deltoid': 'side delts',
  'posterior deltoid': 'rear delts',
  'deltoid': 'shoulders',
  'supraspinatus': 'rotator cuff',
  // arms
  'biceps brachii': 'biceps',
  'brachialis': 'brachialis',
  'brachioradialis': 'brachioradialis',
  'triceps brachii': 'triceps',
  'wrist flexors': 'forearms',
  'wrist extensors': 'forearms',
  // legs
  'quadriceps': 'quads',
  'hamstrings': 'hamstrings',
  'gluteus maximus': 'glutes',
  'gluteus medius': 'glutes',
  'gluteus minimus': 'glutes',
  'gastrocnemius': 'calves',
  'soleus': 'calves',
  'adductor longus': 'adductors',
  'adductor brevis': 'adductors',
  'adductor magnus': 'adductors',
  'tensor fasciae latae': 'abductors',
  'hip flexors': 'hip flexors',
  'iliopsoas': 'hip flexors',
  'sartorius': 'legs',
  'popliteus': 'legs',
  'tibialis anterior': 'calves',
  // core
  'rectus abdominis': 'abs',
  'obliques': 'obliques',
  'transversus abdominis': 'deep core',
  // misc
  'sternocleidomastoid': 'neck',
  'levator scapulae': 'upper traps',
  'splenius': 'neck',
  'serratus anterior': 'core',
  'serratus ante': 'core',
};

const BODY_PART_FALLBACK = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  'upper arms': 'arms',
  'lower arms': 'arms',
  waist: 'core',
  'upper legs': 'legs',
  'lower legs': 'legs',
  hips: 'legs',
  cardio: 'cardio',
  neck: 'neck',
};

function mapMuscleGroup(bodyPart, target) {
  const t = (target || '').toLowerCase().trim();
  if (TARGET_MUSCLE_MAP[t]) return TARGET_MUSCLE_MAP[t];

  const bp = (bodyPart || '').toLowerCase().trim();
  if (bp === 'upper arms') {
    if (t.includes('bicep')) return 'biceps';
    if (t.includes('tricep')) return 'triceps';
    return 'arms';
  }
  if (bp === 'lower arms') {
    if (t.includes('bicep')) return 'biceps';
    return 'forearms';
  }
  return BODY_PART_FALLBACK[bp] || 'other';
}

async function main() {
  console.log(`📂 Reading ${JSON_FILE}...`);
  const raw = JSON.parse(await fs.readFile(JSON_FILE, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('JSON phải là array');
  console.log(`   ${raw.length} exercises`);

  let videoFiles = [];
  try {
    videoFiles = await fs.readdir(VIDEOS_DIR);
  } catch {}
  const videoSet = new Set(
    videoFiles.filter((f) => f.endsWith('.mp4')).map((f) => f.replace('.mp4', ''))
  );
  console.log(`   ${videoSet.size} video files`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let noVideo = 0;

  for (const item of raw) {
    const id = String(item.id || '').trim();
    if (!id || !item.name) {
      failed++;
      continue;
    }

    const externalId = `local_${id}`;

    try {
      const existing = await prisma.exercise.findUnique({ where: { externalId } });
      if (existing) {
        skipped++;
        continue;
      }

      const hasVideo = videoSet.has(id);
      if (!hasVideo) noVideo++;

      const videoUrl = hasVideo ? `/static/videos/${id}.mp4` : null;
      const muscleGroup = mapMuscleGroup(item.bodyPart, item.target);

      await prisma.exercise.create({
        data: {
          externalId,
          name: item.name,
          muscleGroup,
          equipment: item.equipment || null,
          isCustom: false,
          userId: null,
          videoUrl,
          overview: item.description || null,
          instructions: item.instructions || null,
          targetMuscles: item.target ? [item.target] : null,
          secondaryMuscles: item.secondaryMuscles || null,
          exerciseType: item.category || 'strength',
          bodyParts: item.bodyPart ? [item.bodyPart] : null,
          equipments: item.equipment ? [item.equipment] : null,
        },
      });
      imported++;
    } catch (e) {
      failed++;
      console.error(`   ⚠️  ${id}: ${e.message}`);
    }

    if ((imported + skipped + failed) % 10 === 0) {
      console.log(`   Progress: ${imported} imported, ${skipped} skipped, ${failed} failed`);
    }
  }

  const total = await prisma.exercise.count({ where: { userId: null } });
  const withVideo = await prisma.exercise.count({
    where: { userId: null, videoUrl: { not: null } },
  });

  console.log(`\n✅ Import complete.`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped (already exists): ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Missing video file: ${noVideo}`);
  console.log(`   Total exercises in DB: ${total}`);
  console.log(`   With video: ${withVideo}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
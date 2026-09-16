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

const BODY_PART_MAP = {
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
  neck: 'shoulders',
};

function mapMuscleGroup(bodyPart, target) {
  const bp = (bodyPart || '').toLowerCase();
  const t = (target || '').toLowerCase();
  if (bp === 'upper arms') {
    if (t.includes('bicep')) return 'biceps';
    if (t.includes('tricep')) return 'triceps';
    return 'arms';
  }
  if (bp === 'lower arms') {
    if (t.includes('bicep')) return 'biceps';
    return 'triceps';
  }
  return BODY_PART_MAP[bp] || 'other';
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
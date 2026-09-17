import { prisma } from '../utils/prisma.js';
import { loadAnatomeExercises } from './anatome.service.js';

export async function searchUnifiedExercises(userId, opts = {}) {
  const { q, muscleGroup, muscleSlug, source, limit = 50, offset = 0 } = opts;

  const dbWhere = { OR: [{ userId: null }, { userId }] };
  if (q) dbWhere.name = { contains: q };
  if (muscleGroup) dbWhere.muscleGroup = muscleGroup;
  if (source === 'custom') {
    dbWhere.userId = userId;
    dbWhere.isCustom = true;
  }

  const dbExercises = await prisma.exercise.findMany({
    where: dbWhere,
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      equipment: true,
      isCustom: true,
      videoUrl: true,
      imageUrl: true,
      muscleSlugs: true,
    },
  });

  const dbNames = new Set(dbExercises.map((e) => e.name.toLowerCase()));

  const { exercises: anatomeExercises } = await loadAnatomeExercises();

  let anatomeFiltered = anatomeExercises;
  if (q) {
    const ql = q.toLowerCase();
    anatomeFiltered = anatomeFiltered.filter((e) =>
      e.name.toLowerCase().includes(ql) ||
      (e.muscleSlugs || []).some(m => m.toLowerCase().includes(ql))
    );
  }
  if (muscleSlug) {
    anatomeFiltered = anatomeFiltered.filter((e) =>
      (e.muscleSlugs || []).includes(muscleSlug)
    );
  }

  const merged = [];

  const includeDb = source !== 'anatome';
  const includeAnatome = source !== 'db' && source !== 'custom' && source !== 'video';

  if (includeDb) {
    for (const ex of dbExercises) {
      if (source === 'video' && !ex.videoUrl) continue;
      if (muscleSlug) {
        const customSlugs = Array.isArray(ex.muscleSlugs) ? ex.muscleSlugs : [];
        if (!customSlugs.includes(muscleSlug) && ex.muscleGroup !== muscleSlug) continue;
      }

      const customSlugs = Array.isArray(ex.muscleSlugs) ? ex.muscleSlugs : [];
      const mergedSlugs = customSlugs.length > 0
        ? customSlugs
        : (ex.muscleGroup ? [ex.muscleGroup] : []);

      merged.push({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        bodyPart: ex.muscleGroup,
        equipment: ex.equipment,
        isCustom: ex.isCustom,
        videoUrl: ex.videoUrl,
        imageUrl: ex.imageUrl,
        source: ex.isCustom ? 'custom' : 'db',
        primaryMuscles: mergedSlugs,
        muscleSlugs: mergedSlugs,
        hasSvg: false,
      });
    }
  }

  if (includeAnatome) {
    for (const ex of anatomeFiltered) {
      if (dbNames.has(ex.name.toLowerCase())) continue;

      merged.push({
        id: `anatome:${ex.id}`,
        svgId: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        muscleGroup: ex.bodyPart,
        muscleSlugs: ex.muscleSlugs || [],
        primaryMuscles: ex.primaryMuscles || [],
        secondaryMuscles: ex.secondaryMuscles || [],
        isCustom: false,
        source: 'anatome',
        hasSvg: true,
      });
    }
  }

  merged.sort((a, b) => a.name.localeCompare(b.name));

  const total = merged.length;
  const sliced = merged.slice(offset, offset + limit);

  return { exercises: sliced, total };
}

export async function getUnifiedExercise(userId, id) {
  if (id.startsWith('anatome:')) {
    const anatomeId = id.slice('anatome:'.length);
    const { exercises } = await loadAnatomeExercises();
    const ex = exercises.find((e) => e.id === anatomeId);
    if (!ex) return null;
    return {
      id,
      svgId: ex.id,
      name: ex.name,
      muscleGroup: ex.bodyPart,
      bodyPart: ex.bodyPart,
      muscleSlugs: ex.muscleSlugs || [],
      primaryMuscles: ex.primaryMuscles || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      isCustom: false,
      source: 'anatome',
      hasSvg: true,
      instructions: ex.instructions || [],
      videoUrl: null,
    };
  }

  const ex = await prisma.exercise.findFirst({
    where: { id, OR: [{ userId: null }, { userId }] },
  });
  if (!ex) return null;

  const customSlugs = Array.isArray(ex.muscleSlugs) ? ex.muscleSlugs : [];

  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    isCustom: ex.isCustom,
    source: ex.isCustom ? 'custom' : 'db',
    videoUrl: ex.videoUrl,
    imageUrl: ex.imageUrl,
    primaryMuscles: customSlugs.length > 0 ? customSlugs : (ex.muscleGroup ? [ex.muscleGroup] : []),
    muscleSlugs: customSlugs.length > 0 ? customSlugs : (ex.muscleGroup ? [ex.muscleGroup] : []),
    hasSvg: false,
    instructions: ex.instructions || [],
    overview: ex.overview,
  };
}

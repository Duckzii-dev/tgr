import { prisma } from '../utils/prisma.js';
import { loadAnatomeExercises } from './anatome.service.js';

/**
 * Tìm exercise từ 2 nguồn:
 *   1. DB (Exercise model) — có userId null (seeded) hoặc userId = current user (custom)
 *   2. JSON Anatome (879 exercises) — chỉ metadata + SVG
 *
 * Nguồn DB ưu tiên: nếu 1 exercise có cả trong DB và JSON → dùng DB (có ID ổn định).
 * Đánh dấu `source: 'db' | 'anatome'`.
 */
export async function searchUnifiedExercises(userId, opts = {}) {
  const {
    q,
    muscleGroup,
    equipment,
    difficulty,
    muscleSlug,
    source,      // 'db' | 'anatome' | 'all' | 'video' | 'custom'
    limit = 50,
    offset = 0,
  } = opts;

  // === 1. Fetch từ DB ===
  const dbWhere = {
    OR: [{ userId: null }, { userId }],
  };
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
      userId: true,
    },
  });

  const dbNames = new Set(dbExercises.map((e) => e.name.toLowerCase()));

  // === 2. Fetch từ JSON Anatome ===
  const { exercises: anatomeExercises } = await loadAnatomeExercises();

  let anatomeFiltered = anatomeExercises;
  if (q) {
    const ql = q.toLowerCase();
    anatomeFiltered = anatomeFiltered.filter((e) =>
      e.name.toLowerCase().includes(ql)
    );
  }
  if (muscleSlug) {
    anatomeFiltered = anatomeFiltered.filter((e) =>
      (e.muscleSlugs || []).includes(muscleSlug)
    );
  }

  // === 3. Merge ===
  const merged = [];

  // DB exercises: source = 'db'
  for (const ex of dbExercises) {
    if (source === 'anatome') continue; // filter source
    if (source === 'video' && !ex.videoUrl) continue;
    merged.push({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      isCustom: ex.isCustom,
      videoUrl: ex.videoUrl,
      imageUrl: ex.imageUrl,
      source: ex.isCustom ? 'custom' : 'db',
      primaryMuscles: ex.muscleGroup ? [ex.muscleGroup] : [],
      secondaryMuscles: [],
      hasSvg: false, // DB exercises không có SVG
    });
  }

  // Anatome JSON: source = 'anatome'
  // Chỉ thêm những exercise KHÔNG trùng tên với DB
  if (source !== 'db' && source !== 'custom' && source !== 'video') {
    for (const ex of anatomeFiltered) {
      if (dbNames.has(ex.name.toLowerCase())) continue; // đã có trong DB

      merged.push({
        id: `anatome:${ex.id}`, // prefix để phân biệt
        name: ex.name,
        muscleGroup: ex.primaryMuscles?.[0] || null,
        equipment: null,
        isCustom: false,
        videoUrl: null,
        imageUrl: null,
        source: 'anatome',
        primaryMuscles: ex.primaryMuscles || [],
        secondaryMuscles: ex.secondaryMuscles || [],
        muscleSlugs: ex.muscleSlugs || [],
        secondarySlugs: ex.secondarySlugs || [],
        hasSvg: true,
        svgId: ex.id, // ID gốc để load SVG
      });
    }
  }

  // === 4. Sort + paginate ===
  merged.sort((a, b) => a.name.localeCompare(b.name));

  const total = merged.length;
  const sliced = merged.slice(offset, offset + limit);

  return { exercises: sliced, total };
}

/**
 * Lấy chi tiết 1 exercise — hỗ trợ cả id DB và `anatome:xxx`.
 */
export async function getUnifiedExercise(userId, id) {
  // Anatome exercise?
  if (id.startsWith('anatome:')) {
    const anatomeId = id.slice('anatome:'.length);
    const { exercises } = await loadAnatomeExercises();
    const ex = exercises.find((e) => e.id === anatomeId);
    if (!ex) return null;
    return {
      id,
      name: ex.name,
      muscleGroup: ex.primaryMuscles?.[0] || null,
      equipment: null,
      isCustom: false,
      source: 'anatome',
      primaryMuscles: ex.primaryMuscles || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      muscleSlugs: ex.muscleSlugs || [],
      secondarySlugs: ex.secondarySlugs || [],
      hasSvg: true,
      svgId: ex.id,
      instructions: ex.instructions || [],
      videoUrl: null,
    };
  }

  // DB exercise
  const ex = await prisma.exercise.findFirst({
    where: { id, OR: [{ userId: null }, { userId }] },
  });
  if (!ex) return null;

  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    isCustom: ex.isCustom,
    source: ex.isCustom ? 'custom' : 'db',
    videoUrl: ex.videoUrl,
    imageUrl: ex.imageUrl,
    primaryMuscles: ex.muscleGroup ? [ex.muscleGroup] : [],
    secondaryMuscles: [],
    hasSvg: false,
    instructions: ex.instructions || [],
    overview: ex.overview,
  };
}

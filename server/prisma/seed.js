import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EXERCISES = [
  { name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Incline Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Decline Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Cable Fly', muscleGroup: 'chest', equipment: 'cable' },
  { name: 'Pec Deck', muscleGroup: 'chest', equipment: 'machine' },
  { name: 'Push-up', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Dips', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'T-Bar Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Pull-up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Chin-up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell' },
  { name: 'Face Pull', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Shrug', muscleGroup: 'back', equipment: 'dumbbell' },
  { name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Arnold Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Front Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Cable Lateral Raise', muscleGroup: 'shoulders', equipment: 'cable' },
  { name: 'Upright Row', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'barbell' },
  { name: 'Concentration Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Chin-up (biceps)', muscleGroup: 'biceps', equipment: 'bodyweight' },
  { name: 'Triceps Pushdown', muscleGroup: 'triceps', equipment: 'cable' },
  { name: 'Overhead Triceps Extension', muscleGroup: 'triceps', equipment: 'dumbbell' },
  { name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'barbell' },
  { name: 'Close-Grip Bench Press', muscleGroup: 'triceps', equipment: 'barbell' },
  { name: 'Diamond Push-up', muscleGroup: 'triceps', equipment: 'bodyweight' },
  { name: 'Triceps Kickback', muscleGroup: 'triceps', equipment: 'dumbbell' },
  { name: 'Bench Dip', muscleGroup: 'triceps', equipment: 'bodyweight' },
  { name: 'Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Front Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Leg Extension', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Leg Curl', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Walking Lunge', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Calf Raise', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Hip Thrust', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Hack Squat', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Goblet Squat', muscleGroup: 'legs', equipment: 'dumbbell' },
];

const TEMPLATES = {
  Push: ['Bench Press', 'Incline Dumbbell Press', 'Overhead Press', 'Lateral Raise', 'Triceps Pushdown', 'Overhead Triceps Extension'],
  Pull: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Barbell Curl', 'Hammer Curl'],
  Legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Hip Thrust'],
  Upper: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Barbell Curl', 'Triceps Pushdown'],
};

const rnd = (min, max) => Math.random() * (max - min) + min;
const rndInt = (min, max) => Math.floor(rnd(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
    console.log('Seeding exercises...');
    for (const e of EXERCISES) {
      const existing = await prisma.exercise.findFirst({
        where: { name: e.name, userId: null },
      });
      if (!existing) {
        await prisma.exercise.create({
          data: { ...e, isCustom: false, userId: null },
        });
      }
    }
/*
  console.log('Creating demo user...');
  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@gymprogress.dev' },
    update: {},
    create: {
      email: 'demo@gymprogress.dev',
      name: 'Demo Lifter',
      passwordHash,
      emailVerified: true,
    },
  });
  */

  await prisma.personalRecord.deleteMany({ where: { userId: user.id } });
  await prisma.workout.deleteMany({ where: { userId: user.id } });
  await prisma.bodyWeight.deleteMany({ where: { userId: user.id } });
  await prisma.trainingSchedule.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });

  console.log('Seeding training schedule...');
  const schedule = [
    { weekday: 1, workoutType: 'strength', isPlanned: true },
    { weekday: 2, workoutType: 'strength', isPlanned: true },
    { weekday: 3, workoutType: 'rest', isPlanned: true },
    { weekday: 4, workoutType: 'strength', isPlanned: true },
    { weekday: 5, workoutType: 'strength', isPlanned: true },
    { weekday: 6, workoutType: 'cardio', isPlanned: true },
    { weekday: 0, workoutType: 'rest', isPlanned: true },
  ];
  for (const s of schedule) {
    await prisma.trainingSchedule.create({ data: { userId: user.id, ...s } });
  }

  const allEx = await prisma.exercise.findMany({ where: { userId: null } });
  const byName = new Map(allEx.map((e) => [e.name, e]));

  const base = {
    'Bench Press': 60, 'Incline Dumbbell Press': 22, 'Overhead Press': 35,
    'Lateral Raise': 8, 'Triceps Pushdown': 25, 'Overhead Triceps Extension': 20,
    'Deadlift': 100, 'Barbell Row': 55, 'Lat Pulldown': 55, 'Face Pull': 20,
    'Barbell Curl': 25, 'Hammer Curl': 12,
    'Squat': 80, 'Romanian Deadlift': 70, 'Leg Press': 140, 'Leg Curl': 40,
    'Calf Raise': 60, 'Hip Thrust': 80,
  };

  console.log('Generating 6 months of bodyweight history...');
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 6);

  let bodyWeight = 82;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (Math.random() < 0.08) {
      bodyWeight += rnd(-0.4, 0.3);
      bodyWeight = +bodyWeight.toFixed(1);
      await prisma.bodyWeight.create({
        data: { userId: user.id, weight: bodyWeight, recordedAt: new Date(d), notes: null },
      });
    }
  }

  console.log('Generating 6 months of workouts...');
  const splitByDay = { 1: 'Push', 2: 'Pull', 4: 'Legs', 5: 'Upper' };

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const weekday = d.getDay();
    const type = splitByDay[weekday];
    if (!type) continue;
    if (Math.random() < 0.15) continue;

    const weekNum = Math.floor((d - start) / (7 * 86400000));

    const startTime = new Date(d);
    startTime.setHours(18, 0, 0, 0);
    const durationSec = rndInt(55, 90) * 60;
    const endTime = new Date(startTime.getTime() + durationSec * 1000);

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        name: type,
        date: new Date(d),
        workoutType: 'strength',
        startTime,
        endTime,
        duration: durationSec,
        notes: null,
      },
    });

    const exercisesForType = TEMPLATES[type];
    for (let i = 0; i < exercisesForType.length; i++) {
      const exName = exercisesForType[i];
      const ex = byName.get(exName);
      if (!ex) continue;

      const we = await prisma.workoutExercise.create({
        data: { workoutId: workout.id, exerciseId: ex.id, order: i },
      });

      const startW = base[exName] || 40;
      const weight = +(startW * (1 + weekNum * 0.02) + rnd(-1, 1)).toFixed(1);
      const numSets = rndInt(3, 4);

      for (let s = 1; s <= numSets; s++) {
        const reps = rndInt(5, 12);
        const w = +weight.toFixed(1);
        const est = reps <= 20 ? +(w * (1 + reps / 30)).toFixed(2) : null;

        await prisma.workoutSet.create({
          data: {
            workoutExerciseId: we.id,
            setNumber: s,
            weight: w,
            reps,
            rir: rndInt(0, 3),
            rpe: +rnd(6, 9).toFixed(1),
            restSeconds: pick([60, 90, 120, 150]),
            estimated1RM: est,
          },
        });

        const candidates = [
          { type: 'max_weight', value: w, reps, weight: w },
          { type: 'max_reps', value: reps, reps, weight: w },
          { type: 'max_volume', value: w * reps, reps, weight: w },
        ];
        if (est != null) candidates.push({ type: 'estimated_1rm', value: est, reps, weight: w });

        for (const c of candidates) {
          const prev = await prisma.personalRecord.findFirst({
            where: { userId: user.id, exerciseId: ex.id, type: c.type },
            orderBy: { value: 'desc' },
          });
          if (!prev || c.value > prev.value) {
            await prisma.personalRecord.create({
              data: {
                userId: user.id,
                exerciseId: ex.id,
                type: c.type,
                value: c.value,
                reps: c.reps,
                weight: c.weight,
                achievedAt: endTime,
              },
            });
          }
        }
      }
    }
  }

  console.log('Creating demo goals...');
  const bench = byName.get('Bench Press');
  const squat = byName.get('Squat');
  await prisma.goal.create({
    data: { userId: user.id, type: 'exercise_pr', title: 'Bench Press 100kg', target: 100, unit: 'kg', exerciseId: bench.id },
  });
  await prisma.goal.create({
    data: { userId: user.id, type: 'exercise_pr', title: 'Squat 140kg', target: 140, unit: 'kg', exerciseId: squat.id },
  });
  await prisma.goal.create({
    data: { userId: user.id, type: 'workout_count', title: '100 workouts', target: 100, unit: 'sessions' },
  });

  console.log('✅ Seed complete.');
  console.log('   Login: demo@gymprogress.dev / Demo1234!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
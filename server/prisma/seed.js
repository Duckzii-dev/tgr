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
  console.log(`✅ ${EXERCISES.length} exercises ready.`);

  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    console.log('SEED_EMAIL / SEED_PASSWORD not set — skipping user creation.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists. Done.`);
    return;
  }

  console.log(`Creating user: ${email}`);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: email.split('@')[0],
      emailVerified: true,
    },
  });
  console.log(`✅ Created user: ${email}`);
  console.log('🎉 Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
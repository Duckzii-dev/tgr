import { prisma } from '../utils/prisma.js';
import { dateKeyInTz } from '../utils/calc.js';

async function getUserTz(userId) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return u?.timezone || 'UTC';
}

export async function getCalendar(req, res) {
  const userId = req.user.id;
  const tz = await getUserTz(userId);
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  // Range UTC rộng hơn 1 ngày để bao phủ mọi offset timezone
  const start = new Date(Date.UTC(y, m - 1, 1));
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  end.setUTCDate(end.getUTCDate() + 1);

  const [workouts, schedules] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    }),
    prisma.trainingSchedule.findMany({ where: { userId } }),
  ]);

  const byWeekday = new Map(schedules.map((s) => [s.weekday, s]));
  const byDate = new Map();
  for (const w of workouts) {
    const k = dateKeyInTz(w.date, tz);
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k).push(w);
  }

  const days = [];
  const cursor = new Date(Date.UTC(y, m - 1, 1));
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let day = 1; day <= lastDay; day++) {
    const k = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(Date.UTC(y, m - 1, day));
    const weekday = d.getUTCDay();
    const dayW = byDate.get(k) || [];
    const sched = byWeekday.get(weekday);
    const has = dayW.length > 0;
    const plannedTraining = !!sched && sched.isPlanned && sched.workoutType !== 'rest';

    let status;
    if (plannedTraining && has) status = 'completed';
    else if (plannedTraining && !has) status = 'missed';
    else if (sched && sched.workoutType === 'rest' && !has) status = 'rest';
    else if (sched && sched.workoutType === 'rest' && has) status = 'unplanned';
    else if (has) status = 'unplanned';
    else status = 'rest';

    days.push({
      date: k,
      status,
      workouts: dayW.map((w) => ({
        id: w.id,
        name: w.name,
        workoutType: w.workoutType,
        duration: w.duration,
      })),
    });
  }

  res.json({ days });
}
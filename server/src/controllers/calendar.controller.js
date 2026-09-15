import { prisma } from '../utils/prisma.js';

export async function getCalendar(req, res) {
  const userId = req.user.id;
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));

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
    const k = new Date(w.date).toISOString().slice(0, 10);
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k).push(w);
  }

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const k = cursor.toISOString().slice(0, 10);
    const weekday = cursor.getUTCDay();
    const dayW = byDate.get(k) || [];
    const sched = byWeekday.get(weekday);
    const has = dayW.length > 0;
    const plannedTraining = !!sched && sched.isPlanned && sched.workoutType !== 'rest';

    let status = 'unplanned';
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
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  res.json({ days });
}
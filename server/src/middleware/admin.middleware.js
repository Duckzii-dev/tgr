import { prisma } from '../utils/prisma.js';

/**
 * Yêu cầu user.role === 'admin'.
 * Phải chạy SAU requireAuth (đã có req.user).
 * Check DB mỗi request để phản ánh ngay khi role bị revoke.
 */
export async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, role: true, isBanned: true },
  });

  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.isBanned) return res.status(403).json({ error: 'Account banned' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  req.admin = user;
  next();
}
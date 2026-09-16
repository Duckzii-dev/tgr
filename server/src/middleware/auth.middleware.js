import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
        bannedReason: true,
      },
    });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.isBanned) {
      res.clearCookie('token', { path: '/' });
      return res.status(403).json({
        error: 'Account has been banned',
        reason: user.bannedReason || undefined,
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  req.admin = { id: req.user.id, email: req.user.email };
  next();
}
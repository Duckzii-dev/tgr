import { prisma } from '../utils/prisma.js';

/**
 * Kiểm tra user có bị ban không (sau requireAuth).
 * Nếu banned → clear cookie + 403.
 */
export async function checkBanned(req, res, next) {
  if (!req.user) return next();

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { isBanned: true, bannedReason: true },
  });

  if (user?.isBanned) {
    res.clearCookie('token', { path: '/' });
    return res.status(403).json({
      error: 'Account has been banned',
      reason: user.bannedReason || undefined,
    });
  }
  next();
}
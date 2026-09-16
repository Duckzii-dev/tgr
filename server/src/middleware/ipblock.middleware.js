import { prisma } from '../utils/prisma.js';

function getClientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  const real = req.headers['x-real-ip'];
  const xff = req.headers['x-forwarded-for'];
  const first = xff ? String(xff).split(',')[0].trim() : null;
  return cf || real || first || req.ip;
}

/**
 * Chặn request từ IP nằm trong bảng IpBlock.
 * Chạy TRƯỚC mọi route /api/*.
 * Skip nếu path là /api/health.
 */
export async function ipBlockGuard(req, res, next) {
  if (req.path === '/api/health') return next();

  const ip = getClientIp(req);
  if (!ip) return next();

  try {
    const block = await prisma.ipBlock.findUnique({ where: { ip } });
    if (!block) return next();

    if (block.expiresAt && new Date(block.expiresAt) < new Date()) {
      // hết hạn → xoá và cho qua
      await prisma.ipBlock.delete({ where: { id: block.id } }).catch(() => {});
      return next();
    }

    return res.status(403).json({
      error: 'Access denied from this IP',
      reason: block.reason || undefined,
      expiresAt: block.expiresAt || undefined,
    });
  } catch (e) {
    // DB lỗi → không chặn oan, cho qua
    console.error('[ipBlockGuard]', e.message);
    next();
  }
}

export { getClientIp };
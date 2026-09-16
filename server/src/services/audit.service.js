import { prisma } from '../utils/prisma.js';
import { getClientIp } from '../middleware/ipblock.middleware.js';

/**
 * Ghi audit log. Không throw nếu lỗi — chỉ log console.
 */
export async function writeAudit({
  req,
  actor,
  action,
  targetType = null,
  targetId = null,
  meta = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id || null,
        actorEmail: actor?.email || null,
        action,
        targetType,
        targetId,
        meta: meta || undefined,
        ip: req ? getClientIp(req) : null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (e) {
    console.error('[audit]', e.message);
  }
}
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.__prisma || new PrismaClient();
if (!globalForPrisma.__prisma) globalForPrisma.__prisma = prisma;
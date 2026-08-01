import { PrismaClient } from '@prisma/client';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Ensure DATABASE_URL is loaded before PrismaClient is instantiated.
// Prisma looks for .env next to schema.prisma, but when running via ts-node-dev
// from a parent workspace, that auto-discovery can fail. We load it explicitly.
dotenvConfig({ path: path.resolve(__dirname, '../.env') });
dotenvConfig({ path: path.resolve(__dirname, '../../../.env') });
dotenvConfig();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://vizagops:vizagops_password@localhost:5432/vizagops_db?schema=public';
}

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export * from '@prisma/client';

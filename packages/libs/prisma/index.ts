import { PrismaClient } from "@prisma/client";

declare global {
  var prismadb: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prismadb?: PrismaClient;
};

const prisma = globalForPrisma.prismadb ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismadb = prisma;

export default prisma;

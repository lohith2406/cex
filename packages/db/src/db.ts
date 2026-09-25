import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createPrismaClient(url: string) {
  const adapter = new PrismaPg({
    connectionString: url,
  });
  
  const prisma = new PrismaClient({
    adapter,
  });

  return prisma;
}
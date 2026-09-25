import { createPrismaClient } from "@repo/db";
import { DATABASE_URL } from "./env";

export const prisma = createPrismaClient(DATABASE_URL);

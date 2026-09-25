import { createRedisClient } from "@repo/redis";
import { REDIS_URL } from "./env";

export const reader = await createRedisClient(REDIS_URL);
export const writer = await createRedisClient(REDIS_URL);
import { createRedisClient } from "@repo/redis";
import { REDIS_URL } from "./env";

export const subscriber = await createRedisClient(REDIS_URL);
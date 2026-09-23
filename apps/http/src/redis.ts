import { makeClient } from "@repo/redis";
import { REDIS_URL } from "./env";

export const engineRequestQueue = await makeClient(REDIS_URL);
export const engineReplyQueue = await makeClient(REDIS_URL);
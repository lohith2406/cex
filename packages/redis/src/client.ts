import { createClient } from "redis";

export async function createRedisClient(url: string) {
    const client = createClient({
        url
      });
      
      client.on('error', err => console.log('Redis Client Error', err));
      
      await client.connect();

      return client;
}
  
function env(value: string | undefined): string {
    if (!value) {
        throw new Error("Environment variable is missing");
    }

    return value;
}

export const REDIS_URL = env(process.env.REDIS_URL);
export const DATABASE_URL = env(process.env.DATABASE_URL);
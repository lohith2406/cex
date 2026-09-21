function env(value: string | undefined): string {
    if (!value) {
      throw new Error("Environment variable is missing");
    }

    return value;
}

export const JWT_SECRET = env(process.env.JWT_SECRET);
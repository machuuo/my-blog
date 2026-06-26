export class MissingEnvError extends Error {
  readonly key: string;

  constructor(key: string) {
    super(`Missing required env: ${key}`);
    this.name = "MissingEnvError";
    this.key = key;
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new MissingEnvError(key);
  }
  return value;
}

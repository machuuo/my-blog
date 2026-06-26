import { MissingEnvError, requireEnv } from "./env";

const TEST_KEY = "A4_TEST_REQUIRE_ENV";

describe("requireEnv", () => {
  beforeEach(() => {
    delete process.env[TEST_KEY];
  });

  afterEach(() => {
    delete process.env[TEST_KEY];
  });

  it("returns the env value when it is a non-empty string", () => {
    process.env[TEST_KEY] = "secret-value";
    expect(requireEnv(TEST_KEY)).toBe("secret-value");
  });

  it("throws when the env is undefined", () => {
    expect(() => requireEnv(TEST_KEY)).toThrow(
      `Missing required env: ${TEST_KEY}`,
    );
  });

  it("throws when the env is an empty string", () => {
    process.env[TEST_KEY] = "";
    expect(() => requireEnv(TEST_KEY)).toThrow(
      `Missing required env: ${TEST_KEY}`,
    );
  });

  it("formats the error message exactly as 'Missing required env: <KEY>'", () => {
    expect(() => requireEnv(TEST_KEY)).toThrow(
      new MissingEnvError(TEST_KEY),
    );
  });

  it("throws MissingEnvError (distinguishable from generic Error) carrying the key", () => {
    try {
      requireEnv(TEST_KEY);
      throw new Error("requireEnv should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(MissingEnvError);
      expect((error as MissingEnvError).key).toBe(TEST_KEY);
      expect((error as MissingEnvError).name).toBe("MissingEnvError");
    }
  });
});

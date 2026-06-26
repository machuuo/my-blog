import { requireEnv } from "./env";

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
      new Error(`Missing required env: ${TEST_KEY}`),
    );
  });
});

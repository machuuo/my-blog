import { render, screen } from "@testing-library/react";

import LoginPage from "./page";

vi.mock("@/features/auth", () => ({
  LoginForm: ({ redirectTo }: { redirectTo?: string }) => (
    <div data-testid="login-form" data-redirect-to={redirectTo} />
  ),
}));

async function redirectToFor(redirect?: string | string[]): Promise<string | null> {
  const searchParams = Promise.resolve(redirect === undefined ? {} : { redirect });
  render(await LoginPage({ searchParams }));
  return screen.getByTestId("login-form").getAttribute("data-redirect-to");
}

describe("LoginPage redirect query", () => {
  it("passes /write when the redirect key appears twice (array)", async () => {
    expect(await redirectToFor(["/write/a", "/write/b"])).toBe("/write");
  });

  it("passes a string redirect through", async () => {
    expect(await redirectToFor("/write/my-post")).toBe("/write/my-post");
  });

  it("passes /write for an empty redirect", async () => {
    expect(await redirectToFor("")).toBe("/write");
  });

  it("passes /write when there is no redirect", async () => {
    expect(await redirectToFor()).toBe("/write");
  });
});

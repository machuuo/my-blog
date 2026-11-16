import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LoginForm } from "./LoginForm";

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api")>();
  return { ...actual, postJson: vi.fn().mockResolvedValue(undefined) };
});

async function logInWith(redirectTo?: string): Promise<void> {
  render(redirectTo === undefined ? <LoginForm /> : <LoginForm redirectTo={redirectTo} />);
  fireEvent.change(screen.getByPlaceholderText("비밀번호를 입력하세요"), {
    target: { value: "secret" },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
  await waitFor(() => {
    expect(push).toHaveBeenCalledTimes(1);
  });
}

describe("LoginForm redirect after login", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  it("sends an external redirect target to /write instead", async () => {
    await logInWith("https://evil.test");

    expect(push).toHaveBeenCalledWith("/write");
  });

  it("keeps the same-site path that the proxy puts in the redirect parameter", async () => {
    await logInWith("/write/my-post");

    expect(push).toHaveBeenCalledWith("/write/my-post");
  });

  it("goes to /write when no redirect target is given", async () => {
    await logInWith();

    expect(push).toHaveBeenCalledWith("/write");
  });
});

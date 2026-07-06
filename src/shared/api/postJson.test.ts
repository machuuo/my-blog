import { describe, expect, it, vi } from "vitest";

import { HttpError } from "./HttpError";
import { postJson } from "./postJson";

describe("postJson", () => {
  it("성공 시 파싱된 JSON 객체를 그대로 반환한다", async () => {
    const data = { id: 1, title: "hello" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    }) as unknown as typeof fetch;

    const result = await postJson("/api/posts", { title: "hello" });

    expect(result).toEqual(data);
  });

  it("실패 시 HttpError를 throw하고 status를 담는다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(postJson("/api/posts", {})).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(400);
      return true;
    });
  });

  it("에러 body의 error 메시지를 그대로 사용한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "커스텀 메시지" }),
    }) as unknown as typeof fetch;

    await expect(postJson("/api/posts", {})).rejects.toThrow("커스텀 메시지");
  });

  it("에러 body에 error가 없으면 기본 메시지로 폴백한다", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "" }),
    }) as unknown as typeof fetch;

    await expect(postJson("/api/posts", {})).rejects.toThrow("요청 실패");
  });

  it("method 인자가 fetch에 전달되고 body는 JSON.stringify, Content-Type 헤더가 붙는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const body = { title: "hello" };
    await postJson("/api/posts/1", body, "DELETE");

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/1", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });
});

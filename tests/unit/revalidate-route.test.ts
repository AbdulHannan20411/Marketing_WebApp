import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  cacheLife: () => {},
  cacheTag: () => {},
}));

async function loadRoute(secret: string | undefined) {
  vi.resetModules();
  if (secret === undefined) delete process.env.REVALIDATE_SECRET;
  else process.env.REVALIDATE_SECRET = secret;
  return import("@/app/api/revalidate-pricing/route");
}

function post(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/revalidate-pricing", { method: "POST", headers });
}

describe("POST /api/revalidate-pricing", () => {
  beforeEach(() => revalidateTag.mockReset());
  afterEach(() => {
    delete process.env.REVALIDATE_SECRET;
  });

  it("expires the pricing tag immediately with the right secret", async () => {
    const { POST } = await loadRoute("s3cret-value");
    const response = await POST(post({ "x-revalidate-secret": "s3cret-value" }));
    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("pricing", { expire: 0 });
  });

  it("rejects a wrong or missing secret", async () => {
    const { POST } = await loadRoute("s3cret-value");
    expect((await POST(post({ "x-revalidate-secret": "nope" }))).status).toBe(401);
    expect((await POST(post())).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses to run when no secret is configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await loadRoute(undefined);
    expect((await POST(post({ "x-revalidate-secret": "" }))).status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "./api";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ApiError", () => {
  it("stores status and message", () => {
    const error = new ApiError("Not found", 404);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it("has correct name", () => {
    const error = new ApiError("Test", 500);
    expect(error.name).toBe("ApiError");
  });
});

describe("api.me", () => {
  it("returns user on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { user: { id: "1", email: "test@test.com", name: "Test", role: "ADMIN" } },
        }),
    });
    const result = await api.me();
    expect(result.user.id).toBe("1");
    expect(result.user.email).toBe("test@test.com");
  });

  it("throws ApiError on 401", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({ success: false, error: { message: "Unauthorized" } }),
    });
    await expect(api.me()).rejects.toThrow(ApiError);
    try {
      await api.me();
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(401);
    }
  });
});

describe("api.login", () => {
  it("sends correct request body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: { user: { id: "1", email: "a@b.com", name: "A", role: "MEMBER" } },
        }),
    });
    await api.login("a@b.com", "password123");
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.email).toBe("a@b.com");
    expect(body.password).toBe("password123");
  });
});

describe("api.logout", () => {
  it("calls POST /auth/logout", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { loggedOut: true } }),
    });
    await api.logout();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/auth/logout");
    expect(options.method).toBe("POST");
  });
});

describe("api.customers", () => {
  it("sends page and search params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: [],
          meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }),
    });
    await api.customers(2, "test");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=2");
    expect(url).toContain("search=test");
  });
});

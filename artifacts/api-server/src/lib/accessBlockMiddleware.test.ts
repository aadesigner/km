import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

const checkAccessBlock = vi.fn();
const resolveBlockIpFromRequest = vi.fn();
const resolveBlockCountryFromRequest = vi.fn();

vi.mock("./accessBlocks.js", () => ({
  checkAccessBlock: (...args: unknown[]) => checkAccessBlock(...args),
  resolveBlockIpFromRequest: (...args: unknown[]) => resolveBlockIpFromRequest(...args),
  resolveBlockCountryFromRequest: (...args: unknown[]) => resolveBlockCountryFromRequest(...args),
}));

const { accessBlockMiddleware } = await import("./accessBlockMiddleware.js");

function mockReq(overrides: Partial<Request> = {}): Request {
  return { path: "/auth/me", ...overrides } as Request;
}

function mockRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
}

describe("accessBlockMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveBlockIpFromRequest.mockReturnValue("203.0.113.1");
    resolveBlockCountryFromRequest.mockReturnValue("US");
    checkAccessBlock.mockResolvedValue({ blocked: false });
  });

  it("bypasses block checks when req.isAdmin was set upstream", async () => {
    const next = vi.fn() as NextFunction;
    await accessBlockMiddleware(mockReq({ isAdmin: true }), mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(checkAccessBlock).not.toHaveBeenCalled();
  });

  it("checks IP/country blocks for non-admin requests", async () => {
    const next = vi.fn() as NextFunction;
    await accessBlockMiddleware(mockReq({ isAdmin: false }), mockRes(), next);
    expect(checkAccessBlock).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 403 when blocked", async () => {
    checkAccessBlock.mockResolvedValue({ blocked: true, reason: "ip" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;
    await accessBlockMiddleware(mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

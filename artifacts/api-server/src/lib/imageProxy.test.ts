import { describe, expect, it } from "vitest";
import { resolveVinPhotoUrlForClient } from "./imageProxy.js";

describe("resolveVinPhotoUrlForClient", () => {
  it("proxies Carstat hosts", () => {
    const out = resolveVinPhotoUrlForClient("https://api.carstat.dev/cars/1.jpg");
    expect(out).toMatch(/^\/api\/vin\/image\?token=/);
  });

  it("does not proxy Encar, GetCar, or generic CDN hosts", () => {
    expect(resolveVinPhotoUrlForClient("https://img.encar.com/cars/1.jpg")).toBe(
      "https://img.encar.com/cars/1.jpg",
    );
    expect(resolveVinPhotoUrlForClient("https://imgsv.getcarapi.com/p/cdn1.jpg")).toBe(
      "https://imgsv.getcarapi.com/p/cdn1.jpg",
    );
    expect(resolveVinPhotoUrlForClient("https://d111111abcdef8.cloudfront.net/a.jpg")).toBe(
      "https://d111111abcdef8.cloudfront.net/a.jpg",
    );
  });

  it("passes through non-allowlisted admin URLs unchanged", () => {
    const url = "https://images.example-server.net/vehicle/front.jpg";
    expect(resolveVinPhotoUrlForClient(url)).toBe(url);
  });

  it("keeps existing proxy paths", () => {
    const path = "/api/vin/image?token=abc";
    expect(resolveVinPhotoUrlForClient(path)).toBe(path);
  });
});

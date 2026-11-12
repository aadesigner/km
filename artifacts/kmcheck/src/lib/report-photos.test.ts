import { describe, expect, it } from "vitest";
import { resolveReportPhotoSets } from "./report-photos";

describe("resolveReportPhotoSets", () => {
  it("swaps Jeep Carstat demo media for Honda stock on CR-V reports", () => {
    const jeep =
      "https://v-h-r.b-cdn.net/vhr/media/017760110fc426b7d79008da1c0427467829a05cd60dcfdb3ca4a5a9a0b39f42.webp";
    const out = resolveReportPhotoSets({
      photos: [jeep],
      make: "Honda",
      model: "CR-V",
    });
    expect(out.photos[0]).toContain("honda-crv.jpg");
    expect(out.photosHd[0]).toContain("honda-crv.jpg");
  });

  it("keeps Jeep media when the report make is Jeep", () => {
    const jeep =
      "https://v-h-r.b-cdn.net/vhr/media/017760110fc426b7d79008da1c0427467829a05cd60dcfdb3ca4a5a9a0b39f42.webp";
    const out = resolveReportPhotoSets({
      photos: [jeep],
      make: "Jeep",
      model: "Grand Cherokee",
    });
    expect(out.photos[0]).toBe(jeep);
  });
});

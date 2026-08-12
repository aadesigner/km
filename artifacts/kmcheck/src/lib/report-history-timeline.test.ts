import { describe, expect, it } from "vitest";
import {
  collectReportTimelineEvents,
  hasManualMileageDetail,
  shouldShowReportTimeline,
  shouldShowTimelineMarkerGroup,
} from "./report-history-timeline";

describe("shouldShowReportTimeline", () => {
  it("hides production year alone", () => {
    const events = collectReportTimelineEvents({ year: 2018 });
    expect(events.some((e) => e.type === "production")).toBe(true);
    expect(shouldShowReportTimeline(events)).toBe(false);
  });

  it("hides undated mileage (never enters the timeline)", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      mileageHistory: [{ odometer: 42_000, date: null }],
    });
    expect(events.every((e) => e.type === "production")).toBe(true);
    expect(shouldShowReportTimeline(events)).toBe(false);
  });

  it("hides a single dated mileage reading (listing odometer only)", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      mileageHistory: [{ odometer: 42_000, date: "2024-06-01" }],
    });
    expect(events.some((e) => e.type === "mileage")).toBe(true);
    expect(shouldShowReportTimeline(events)).toBe(false);
  });

  it("shows when there are 2+ dated mileage days", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      mileageHistory: [
        { odometer: 10_000, date: "2020-01-01" },
        { odometer: 42_000, date: "2024-06-01" },
      ],
    });
    expect(shouldShowReportTimeline(events)).toBe(true);
  });

  it("shows when there is a dated accident", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      accidents: [{ date: "2021-03-15", severity: "minor" }],
    });
    expect(shouldShowReportTimeline(events)).toBe(true);
  });

  it("shows when there is manual service history", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      serviceHistory: [{
        date: "2022-05-10",
        title: "Service",
        location: "Seoul",
        description: "Oil change",
        mileage: 45_000,
      }],
    });
    expect(shouldShowReportTimeline(events)).toBe(true);
    const serviceGroup = events.filter((e) => e.type === "service");
    expect(shouldShowTimelineMarkerGroup(serviceGroup)).toBe(true);
  });

  it("shows annotated mileage with location or services text", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      mileageHistory: [{
        odometer: 42_000,
        date: "2024-06-01",
        location: "Tirana",
        description: "Brake pads replaced",
      }],
    });
    const mileage = events.find((e) => e.type === "mileage")!;
    expect(hasManualMileageDetail(mileage)).toBe(true);
    expect(shouldShowReportTimeline(events)).toBe(true);
    expect(shouldShowTimelineMarkerGroup([mileage])).toBe(true);
  });

  it("includes manual mileage title and treats it as graph-worthy", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      mileageHistory: [{
        odometer: 42_000,
        date: "2024-06-01",
        titleStatus: "Oil service visit",
      }],
    });
    const mileage = events.find((e) => e.type === "mileage")!;
    expect(mileage.titleStatus).toBe("Oil service visit");
    expect(hasManualMileageDetail(mileage)).toBe(true);
    expect(shouldShowReportTimeline(events)).toBe(true);
  });

  it("hides bare mileage markers but keeps them on the line", () => {
    const events = collectReportTimelineEvents({
      year: 2018,
      mileageHistory: [{ odometer: 42_000, date: "2024-06-01" }],
    });
    const mileage = events.find((e) => e.type === "mileage")!;
    expect(hasManualMileageDetail(mileage)).toBe(false);
    expect(shouldShowTimelineMarkerGroup([mileage])).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  EMAIL_TEMPLATE_DEFAULTS,
  getSampleTemplateVars,
  interpolateEmailVars,
  renderEmailTemplate,
} from "./emailTemplates";

describe("interpolateEmailVars", () => {
  it("replaces placeholders", () => {
    expect(interpolateEmailVars("Hi {{name}}, VIN {{vin}}", { name: "Alex", vin: "ABC" }))
      .toBe("Hi Alex, VIN ABC");
  });

  it("leaves unknown placeholders empty", () => {
    expect(interpolateEmailVars("{{missing}}", {})).toBe("");
  });
});

describe("renderEmailTemplate", () => {
  it("uses custom subject and content", () => {
    const { subject, html } = renderEmailTemplate(
      "welcome",
      getSampleTemplateVars("welcome", "https://kmcheck.com"),
      { subject: "Hello {{name}}!", contentHtml: "<p>Custom for {{name}}</p>" },
      "https://kmcheck.com",
    );
    expect(subject).toBe("Hello Alex!");
    expect(html).toContain("Custom for Alex");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("falls back to defaults when no override", () => {
    const { subject } = renderEmailTemplate(
      "welcome",
      getSampleTemplateVars("welcome", "https://kmcheck.com"),
      undefined,
      "https://kmcheck.com",
    );
    expect(subject).toBe(EMAIL_TEMPLATE_DEFAULTS.welcome.subject);
  });
});

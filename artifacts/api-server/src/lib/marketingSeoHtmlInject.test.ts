import { describe, expect, it } from "vitest";
import { injectMarketingPageSsrFromPath } from "./marketingSeoHtmlInject.js";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;

describe("marketingSeoHtmlInject", () => {
  it("injects localized H1 for EN and SQ home paths", () => {
    const en = injectMarketingPageSsrFromPath(SAMPLE_HTML, "/en");
    const sq = injectMarketingPageSsrFromPath(SAMPLE_HTML, "/sq");
    expect(en).toContain('<main id="kmcheck-page-ssr"');
    expect(en).toMatch(/<h1>[^<]*mileage/i);
    expect(sq).toMatch(/<h1>[^<]*Kontroll/i);
  });

  it("injects pricing page SSR body", () => {
    const html = injectMarketingPageSsrFromPath(SAMPLE_HTML, "/en/pricing");
    expect(html).toMatch(/<h1>[^<]*payment/i);
  });

  it("skips non-marketing routes", () => {
    const html = injectMarketingPageSsrFromPath(SAMPLE_HTML, "/en/dashboard");
    expect(html).not.toContain("kmcheck-page-ssr");
  });
});

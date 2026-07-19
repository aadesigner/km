import { buildEmailBase } from "./emailLayout.js";

export type EmailTemplateKey = "welcome" | "confirm" | "vinready" | "reset" | "abandoned";

export type EmailTemplateOverride = {
  subject?: string;
  contentHtml?: string;
};

export type EmailTemplatesConfig = Partial<Record<EmailTemplateKey, EmailTemplateOverride>>;

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateKey, string[]> = {
  welcome: ["name", "siteUrl"],
  confirm: ["name", "email", "vin", "reportUrl", "vehicleLabel", "year", "make", "model", "mileage", "accidents", "owners", "amount", "paymentRef", "siteUrl"],
  vinready: ["name", "vin", "reportUrl", "vehicleLabel", "year", "make", "model", "mileage", "accidents", "siteUrl"],
  reset: ["resetUrl", "siteUrl"],
  abandoned: ["name", "vin", "checkoutUrl", "price", "siteUrl"],
};

type TemplateDefaults = {
  subject: string;
  contentHtml: string;
  preheader?: string;
};

const btn = (href: string, label: string) => `
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="#16a34a" style="border-radius:8px">
      <a href="${href}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;font-family:Arial,Helvetica,sans-serif">${label}</a>
    </td>
  </tr>
</table>`;

export const EMAIL_TEMPLATE_DEFAULTS: Record<EmailTemplateKey, TemplateDefaults> = {
  welcome: {
    subject: "Welcome to kmcheck — VIN history at your fingertips",
    preheader: "Hi {{name}}, your kmcheck account is ready.",
    contentHtml: `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111111">Welcome to kmcheck! &#128075;</h1>
    <p style="margin:0 0 12px;color:#444444">Hi {{name}},</p>
    <p style="margin:0 0 24px;color:#444444">Your account is ready. You can now look up full VIN history reports &mdash; accidents, mileage, previous owners, and more &mdash; for any vehicle.</p>
    ${btn("{{siteUrl}}", "Check a VIN &rarr;")}
  `,
  },
  vinready: {
    subject: "Your VIN report is ready — {{vin}}",
    preheader: "Your VIN history report for {{vin}} is ready to view.",
    contentHtml: `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111111">Your report is ready! &#127881;</h1>
    <p style="margin:0 0 8px;color:#444444">Hi {{name}},</p>
    <p style="margin:0 0 4px;color:#444444">Your VIN history report for <strong>{{vehicleLabel}}</strong> <strong style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px">{{vin}}</strong> has been generated and is ready to view.</p>
    <p style="margin:16px 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif">Key findings</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Recorded mileage</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">{{mileage}} km</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Reported accidents</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">{{accidents}}</td>
      </tr>
    </table>
    ${btn("{{reportUrl}}", "View Report &rarr;")}
  `,
  },
  confirm: {
    subject: "Payment confirmed — Your kmcheck report for {{vin}} is ready",
    preheader: "Your kmcheck VIN report for {{vin}} is ready to view.",
    contentHtml: `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111111">Payment confirmed &#10003;</h1>
    <p style="margin:0 0 4px;color:#444444">Hi {{name}},</p>
    <p style="margin:0 0 16px;color:#444444">Your payment was successful and your full VIN history report is ready to view.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <tr>
        <td bgcolor="#f9fafb" style="padding:16px 20px;background:#f9fafb">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif">Vehicle</p>
          <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#111111;font-family:Arial,Helvetica,sans-serif">{{vehicleLabel}}</p>
          <p style="margin:0;font-family:monospace;font-size:13px;color:#6b7280;background:#e5e7eb;display:inline-block;padding:2px 8px;border-radius:4px">{{vin}}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif">Key findings</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:16px">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Recorded mileage</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">{{mileage}} km</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Reported accidents</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">{{accidents}}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Previous owners</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">{{owners}}</td>
      </tr>
    </table>
    ${btn("{{reportUrl}}", "View Full Report &rarr;")}
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">
      Amount paid: <strong style="color:#555555">{{amount}}</strong> &middot; Ref: <span style="font-family:monospace;font-size:11px">{{paymentRef}}</span>
    </p>
  `,
  },
  reset: {
    subject: "Reset your kmcheck password",
    preheader: "Reset your kmcheck account password — link expires in 1 hour.",
    contentHtml: `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111111">Reset your password</h1>
    <p style="margin:0 0 8px;color:#444444">We received a request to reset the password on your kmcheck account.</p>
    <p style="margin:0 0 24px;color:#444444">Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
    ${btn("{{resetUrl}}", "Reset Password &rarr;")}
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af">If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t change.</p>
  `,
  },
  abandoned: {
    subject: "Your VIN lookup is waiting — complete your purchase",
    preheader: "Complete your VIN check for {{vin}} — {{price}}.",
    contentHtml: `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111111">You left something behind &#128064;</h1>
    <p style="margin:0 0 8px;color:#444444">Hi {{name}},</p>
    <p style="margin:0 0 8px;color:#444444">You started a VIN check for <strong style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px">{{vin}}</strong> but haven&apos;t completed your purchase.</p>
    <p style="margin:0 0 24px;color:#444444">Your full history report is just <strong>{{price}}</strong> away.</p>
    ${btn("{{checkoutUrl}}", "Complete Purchase &mdash; {{price}} &rarr;")}
  `,
  },
};

export function interpolateEmailVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function renderEmailTemplate(
  type: EmailTemplateKey,
  vars: Record<string, string>,
  override: EmailTemplateOverride | undefined,
  siteUrl: string,
): { subject: string; html: string } {
  const defaults = EMAIL_TEMPLATE_DEFAULTS[type];
  const base = siteUrl.replace(/\/$/, "");
  const subjectTpl = override?.subject?.trim() ? override.subject : defaults.subject;
  const contentTpl = override?.contentHtml?.trim() ? override.contentHtml : defaults.contentHtml;
  const subject = interpolateEmailVars(subjectTpl, vars);
  const content = interpolateEmailVars(contentTpl, vars);
  const preheader = defaults.preheader
    ? interpolateEmailVars(defaults.preheader, vars)
    : undefined;
  return {
    subject,
    html: buildEmailBase(content, preheader, base),
  };
}

export function getSampleTemplateVars(type: EmailTemplateKey, siteUrl: string): Record<string, string> {
  const base = siteUrl.replace(/\/$/, "");
  const common = { siteUrl: base, name: "Alex" };
  switch (type) {
    case "welcome":
      return common;
    case "reset":
      return { ...common, resetUrl: `${base}/en/reset-password?token=sample-token` };
    case "abandoned":
      return {
        ...common,
        vin: "WBA3A5G59DNP26082",
        checkoutUrl: `${base}/en/checkout?vin=WBA3A5G59DNP26082`,
        price: "€15.99",
      };
    case "vinready":
      return {
        ...common,
        vin: "WBA3A5G59DNP26082",
        reportUrl: `${base}/en/report/42`,
        year: "2019",
        make: "BMW",
        model: "3 Series",
        vehicleLabel: "2019 BMW 3 Series",
        mileage: "48,200",
        accidents: "1",
      };
    case "confirm":
      return {
        ...common,
        email: "alex@example.com",
        vin: "WBA3A5G59DNP26082",
        reportUrl: `${base}/en/report/42`,
        year: "2019",
        make: "BMW",
        model: "3 Series",
        vehicleLabel: "2019 BMW 3 Series",
        mileage: "48,200",
        accidents: "1",
        owners: "2",
        amount: "€15.99",
        paymentRef: "5XG29384BK",
      };
    default:
      return common;
  }
}

export function mergeTemplateForAdmin(
  type: EmailTemplateKey,
  stored: EmailTemplatesConfig,
): { subject: string; contentHtml: string; isCustom: boolean; variables: string[] } {
  const defaults = EMAIL_TEMPLATE_DEFAULTS[type];
  const override = stored[type];
  const isCustom = Boolean(override?.subject?.trim() || override?.contentHtml?.trim());
  return {
    subject: override?.subject?.trim() ? override.subject : defaults.subject,
    contentHtml: override?.contentHtml?.trim() ? override.contentHtml : defaults.contentHtml,
    isCustom,
    variables: EMAIL_TEMPLATE_VARIABLES[type],
  };
}

/** Build string vars from runtime email data. */
export function varsFromVinReady(data: {
  name: string;
  vin: string;
  reportUrl: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  accidents?: number | null;
  siteUrl: string;
}): Record<string, string> {
  const vehicleLabel = [data.year, data.make, data.model].filter(Boolean).join(" ") || "your vehicle";
  return {
    name: data.name || "there",
    vin: data.vin,
    reportUrl: data.reportUrl,
    year: data.year != null ? String(data.year) : "",
    make: data.make ?? "",
    model: data.model ?? "",
    vehicleLabel,
    mileage: data.mileage != null ? data.mileage.toLocaleString() : "—",
    accidents: data.accidents != null ? String(data.accidents) : "—",
    siteUrl: data.siteUrl.replace(/\/$/, ""),
  };
}

export function varsFromPaymentConfirm(data: {
  name: string;
  email: string;
  vin: string;
  reportUrl: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  accidents?: number | null;
  owners?: number | null;
  amount: number;
  currency: string;
  paymentRef?: string | null;
  siteUrl: string;
}): Record<string, string> {
  const currencySymbol = data.currency === "EUR" ? "€" : "$";
  const amountFormatted = data.amount > 0 ? `${currencySymbol}${data.amount.toFixed(2)}` : "Free";
  return {
    ...varsFromVinReady(data),
    email: data.email,
    owners: data.owners != null ? String(data.owners) : "—",
    amount: amountFormatted,
    paymentRef: data.paymentRef ?? "—",
  };
}

import nodemailer from "nodemailer";
import { db, systemSettingsTable } from "@workspace/db";
import type { EmailTemplateOverride, EmailTemplatesConfig } from "@workspace/db";
import { desc } from "drizzle-orm";
import {
  renderEmailTemplate,
  varsFromPaymentConfirm,
  varsFromVinReady,
  getSampleTemplateVars,
} from "./emailTemplates.js";
import { buildEmailBase } from "./emailLayout.js";

export { buildEmailBase } from "./emailLayout.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function getSmtpSettings() {
  const [settings] = await db
    .select()
    .from(systemSettingsTable)
    .orderBy(desc(systemSettingsTable.id))
    .limit(1);

  if (!settings?.smtpEnabled || !settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
    return null;
  }
  return settings;
}

/** True when admin SMTP is enabled and has host, user, and password. */
export async function isSmtpConfigured(): Promise<boolean> {
  return (await getSmtpSettings()) !== null;
}

export async function getSiteUrl(): Promise<string> {
  try {
    const [settings] = await db
      .select({ siteUrl: systemSettingsTable.siteUrl })
      .from(systemSettingsTable)
      .orderBy(desc(systemSettingsTable.id))
      .limit(1);
    return settings?.siteUrl?.replace(/\/$/, "") ?? "https://kmcheck.com";
  } catch {
    return "https://kmcheck.com";
  }
}

export async function loadEmailTemplatesConfig(): Promise<EmailTemplatesConfig> {
  try {
    const [settings] = await db
      .select({ emailTemplates: systemSettingsTable.emailTemplates })
      .from(systemSettingsTable)
      .orderBy(desc(systemSettingsTable.id))
      .limit(1);
    return (settings?.emailTemplates ?? {}) as EmailTemplatesConfig;
  } catch {
    return {};
  }
}

export async function sendEmail(opts: EmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await getSmtpSettings();
    if (!settings) {
      return { ok: false, error: "SMTP not configured or not enabled" };
    }

    const port = settings.smtpPort ?? 587;
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost!,
      port,
      secure,
      // For port 587 (STARTTLS), enforce the TLS upgrade — prevents silent plaintext fallback
      ...(!secure ? { requireTLS: true } : {}),
      auth: {
        user: settings.smtpUser!,
        pass: settings.smtpPass!,
      },
      // Generous but finite timeouts so a hung connection doesn't block forever
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
      tls: {
        // Defaults to strict cert validation. Set SMTP_INSECURE=true only for
        // private SMTP relays with self-signed certs (not recommended in production).
        rejectUnauthorized: process.env.SMTP_INSECURE !== "true",
      },
    });

    const fromName = settings.smtpFromName ?? "kmcheck";
    const fromEmail = settings.smtpFromEmail ?? settings.smtpUser!;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

// ── Pre-built templates (customizable via admin email templates) ───────────────

export function buildWelcomeEmail(
  name: string,
  siteUrl?: string,
  override?: EmailTemplateOverride,
): { subject: string; html: string } {
  const base = (siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return renderEmailTemplate(
    "welcome",
    { name: name || "there", siteUrl: base },
    override,
    base,
  );
}

export interface VinReadyEmailData {
  name: string;
  vin: string;
  reportUrl: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  accidents?: number | null;
}

export function buildVinReadyEmail(
  data: VinReadyEmailData & { siteUrl?: string },
  override?: EmailTemplateOverride,
): { subject: string; html: string } {
  const siteUrl = (data.siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return renderEmailTemplate(
    "vinready",
    varsFromVinReady({
      name: data.name,
      vin: data.vin,
      reportUrl: data.reportUrl,
      make: data.make,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      accidents: data.accidents,
      siteUrl,
    }),
    override,
    siteUrl,
  );
}

export function buildVinReadySampleHtml(siteUrl = "https://kmcheck.com"): string {
  const { html } = renderEmailTemplate(
    "vinready",
    getSampleTemplateVars("vinready", siteUrl),
    undefined,
    siteUrl,
  );
  return html;
}

export function buildPendingVinEmail(
  name: string,
  vin: string,
  checkoutUrl: string,
  price: string,
  siteUrl?: string,
  override?: EmailTemplateOverride,
): { subject: string; html: string } {
  const base = (siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return renderEmailTemplate(
    "abandoned",
    { name: name || "there", vin, checkoutUrl, price, siteUrl: base },
    override,
    base,
  );
}

export function buildPasswordResetEmail(
  resetUrl: string,
  siteUrl?: string,
  override?: EmailTemplateOverride,
): { subject: string; html: string } {
  const base = (siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return renderEmailTemplate("reset", { resetUrl, siteUrl: base }, override, base);
}

export function buildPromoEmail(
  name: string,
  subject: string,
  bodyHtml: string,
  ctaText?: string,
  ctaUrl?: string,
  siteUrl?: string,
): { subject: string; html: string } {
  const displayName = name || "there";
  const ctaBlock = ctaText && ctaUrl ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px">
      <tr>
        <td bgcolor="#16a34a" style="border-radius:8px">
          <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;font-family:Arial,Helvetica,sans-serif">${ctaText}</a>
        </td>
      </tr>
    </table>
  ` : "";
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111111">Hi ${displayName}!</h1>
    <div style="color:#444444;line-height:1.7">${bodyHtml}</div>
    ${ctaBlock}
  `;
  return {
    subject,
    html: buildEmailBase(content, undefined, siteUrl),
  };
}

export function buildSmtpTestEmail(siteUrl?: string): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#16a34a">SMTP is working! &#10003;</h1>
    <p style="margin:0 0 12px;color:#444444">Your kmcheck email configuration is correctly set up.</p>
    <p style="margin:0;color:#444444">You can now send transactional emails including welcome messages, VIN report notifications, and payment confirmations.</p>
  `;
  return {
    subject: "kmcheck — SMTP test email",
    html: buildEmailBase(content, "Your kmcheck SMTP configuration is working correctly.", siteUrl),
  };
}

// ── Payment confirmation ───────────────────────────────────────────────────────

export interface PaymentConfirmationData {
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
  photos?: string[] | null;
  amount: number;
  currency: string;
  paymentRef?: string | null;
}

export function buildPaymentConfirmationEmail(
  data: PaymentConfirmationData & { siteUrl?: string },
  override?: EmailTemplateOverride,
): { subject: string; html: string } {
  const siteUrl = (data.siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return renderEmailTemplate(
    "confirm",
    varsFromPaymentConfirm({
      name: data.name,
      email: data.email,
      vin: data.vin,
      reportUrl: data.reportUrl,
      make: data.make,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      accidents: data.accidents,
      owners: data.owners,
      amount: data.amount,
      currency: data.currency,
      paymentRef: data.paymentRef,
      siteUrl,
    }),
    override,
    siteUrl,
  );
}

export function buildPaymentConfirmationSampleHtml(siteUrl = "https://kmcheck.com"): string {
  const { html } = renderEmailTemplate(
    "confirm",
    getSampleTemplateVars("confirm", siteUrl),
    undefined,
    siteUrl,
  );
  return html;
}

// ── Admin pending VIN notification ─────────────────────────────────────────────

export interface PendingVinAdminEmailData {
  vin: string;
  vehicleLabel: string;
  adminUrl: string;
  isNewPending: boolean;
  requestCount: number;
  customerEmail?: string | null;
  customerName?: string | null;
  siteUrl?: string;
}

export function buildPendingVinAdminEmail(
  data: PendingVinAdminEmailData,
): { subject: string; html: string; text: string } {
  const siteUrl = (data.siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  const customerLine = data.customerEmail
    ? `${data.customerName ? `${data.customerName} (` : ""}${data.customerEmail}${data.customerName ? ")" : ""}`
    : "—";

  const subject = data.isNewPending
    ? `Action required: new pending VIN check — ${data.vin}`
    : `Pending VIN update — ${data.requestCount} customer${data.requestCount === 1 ? "" : "s"} waiting (${data.vin})`;

  const headline = data.isNewPending
    ? "New pending VIN check"
    : "Another customer paid for a pending VIN";

  const intro = data.isNewPending
    ? "A customer paid for a VIN report that is not in the catalog yet. Review the draft, add data, and publish when ready."
    : "Another customer paid for a VIN that is already in the pending queue. Publish when the report is ready — all waiting customers will be notified.";

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111111">${headline}</h1>
    <p style="margin:0 0 16px;color:#444444">${intro}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">VIN</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:monospace">${data.vin}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Vehicle</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">${data.vehicleLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Customer</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">${customerLine}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#555555;font-family:Arial,Helvetica,sans-serif">Customers waiting</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif">${data.requestCount}</td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#d97706" style="border-radius:8px">
          <a href="${data.adminUrl}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;font-family:Arial,Helvetica,sans-serif">Review &amp; Publish &rarr;</a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">
      Open the admin queue: <a href="${siteUrl}/adminx/pending-vin-checks" style="color:#d97706">${siteUrl}/adminx/pending-vin-checks</a>
    </p>
  `;

  const text = [
    headline,
    "",
    intro,
    "",
    `VIN: ${data.vin}`,
    `Vehicle: ${data.vehicleLabel}`,
    `Customer: ${customerLine}`,
    `Customers waiting: ${data.requestCount}`,
    "",
    `Review: ${data.adminUrl}`,
  ].join("\n");

  return {
    subject,
    html: buildEmailBase(content, subject, siteUrl),
    text,
  };
}

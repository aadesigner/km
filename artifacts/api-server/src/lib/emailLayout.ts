/** Table-based email wrapper — no DB dependencies. */

const EMAIL_LOGO_PATH = "/brand/logo-white.png";
const EMAIL_LOGO_WIDTH = 160;
const EMAIL_LOGO_HEIGHT = 40;

export function emailBrandLogoUrl(siteUrl?: string): string {
  const base = (siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return `${base}${EMAIL_LOGO_PATH}`;
}

function emailHeaderLogo(siteUrl: string): string {
  const logoUrl = emailBrandLogoUrl(siteUrl);
  return `<a href="${siteUrl}" style="text-decoration:none;display:inline-block;line-height:0">
              <img src="${logoUrl}" width="${EMAIL_LOGO_WIDTH}" height="${EMAIL_LOGO_HEIGHT}" alt="kmcheck.com" border="0" style="display:block;border:0;outline:none;text-decoration:none;width:${EMAIL_LOGO_WIDTH}px;max-width:100%;height:auto" />
            </a>`;
}

export function buildEmailBase(content: string, preheader?: string, siteUrl?: string): string {
  const year = new Date().getFullYear();
  const base = (siteUrl ?? "https://kmcheck.com").replace(/\/$/, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>kmcheck</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f3f4f6;line-height:1px">${preheader}&nbsp;&zwnj;&nbsp;</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f4f6">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <tr>
          <td bgcolor="#16a34a" style="padding:22px 32px;background:#16a34a;text-align:left">
            ${emailHeaderLogo(base)}
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#111111;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif">
            ${content}
          </td>
        </tr>
        <tr>
          <td bgcolor="#f9fafb" style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">
              <a href="${base}" style="color:#9ca3af;text-decoration:none">${base.replace(/^https?:\/\//, "")}</a> &middot; VIN History Reports
            </p>
            <p style="margin:5px 0 0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">
              &copy; ${year} kmcheck. All rights reserved.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;font-family:Arial,Helvetica,sans-serif">
              You received this email because you have an account on our platform.<br>
              If you no longer wish to receive these emails, <a href="${base}/unsubscribe" style="color:#9ca3af;text-decoration:underline">unsubscribe here</a>.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

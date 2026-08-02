import { env } from "@/lib/env";

function getLogoUrl() {
  const base = env.APP_URL.replace(/\/$/, "");
  return `${base}/warmhello-logo%20b.PNG`;
}

function formatTimestamp(sentAt: Date) {
  return sentAt.toISOString();
}

export function wrapEmailText(input: { body: string; sentAt: Date }) {
  const logoUrl = getLogoUrl();
  const timestamp = formatTimestamp(input.sentAt);
  const supportEmail = "sales@warm-hello.com";

  return [
    input.body.trim(),
    "",
    `Warm-Hello • ${supportEmail}`,
    `Sent: ${timestamp}`,
    `Logo: ${logoUrl}`,
  ].join("\n");
}

export function wrapEmailHtml(input: { body: string; sentAt: Date }) {
  const logoUrl = getLogoUrl();
  const timestamp = formatTimestamp(input.sentAt);
  const supportEmail = "sales@warm-hello.com";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Warm-Hello</title>
  </head>
  <body style="margin:0; padding:0; background:#0b1220; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0b1220; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px; max-width:600px;">
            <tr>
              <td style="padding:0 20px 14px 20px;">
                <img src="${logoUrl}" alt="Warm-Hello" width="160" height="42" style="display:block; width:160px; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff; border-radius:18px; padding:22px 20px;">
                ${input.body}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px 0 20px; color:#cbd5e1; font-size:12px; line-height:18px;">
                <div>Warm-Hello • <a href="mailto:${supportEmail}" style="color:#cbd5e1; text-decoration:underline;">${supportEmail}</a></div>
                <div>Sent: ${timestamp}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}


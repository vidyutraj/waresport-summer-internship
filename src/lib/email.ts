import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

function baseUrl() {
  return process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
}

/** Strip whitespace and surrounding quotes from env values. */
function trimEnv(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  let v = String(value).trim();
  if (!v) return undefined;
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

function getSendGridApiKey(): string | undefined {
  return trimEnv(process.env.SENDGRID_API_KEY);
}

function getSendGridFromEmail(): string | undefined {
  return trimEnv(process.env.SENDGRID_FROM_EMAIL);
}

/** From header for local SMTP. */
function smtpMailFromHeader(): string {
  const raw = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "";
  if (!raw) {
    throw new Error(
      "Set SMTP_FROM or SMTP_USER for the From address (see .env.example)."
    );
  }
  if (/<[^>]+>/.test(raw)) {
    return raw;
  }
  return `Waresport <${raw}>`;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

/** `next dev` locally usually has no VERCEL. */
function isDeployedOnVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

function sendGridPartialConfig(): boolean {
  const key = Boolean(getSendGridApiKey());
  const from = Boolean(getSendGridFromEmail());
  return key !== from;
}

export function isSendGridConfigured(): boolean {
  return Boolean(getSendGridApiKey() && getSendGridFromEmail());
}

function htmlToPlainSummary(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);
}

function createTransport() {
  if (!isSmtpConfigured()) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (see .env.example)."
    );
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendWithSmtp(
  to: string,
  subject: string,
  html: string
): Promise<unknown> {
  const transport = createTransport();
  return transport.sendMail({
    from: smtpMailFromHeader(),
    to,
    subject,
    html,
  });
}

/** SendGrid over HTTPS (official SDK). Use on Vercel; local can use this too. */
async function sendWithSendGrid(to: string, subject: string, html: string) {
  if (sendGridPartialConfig()) {
    throw new Error(
      "SendGrid requires both SENDGRID_API_KEY and SENDGRID_FROM_EMAIL (see .env.example)."
    );
  }
  const apiKey = getSendGridApiKey()!;
  const fromEmail = getSendGridFromEmail()!;
  const fromName = trimEnv(process.env.SENDGRID_FROM_NAME) || "Waresport";

  const apiHost = trimEnv(process.env.SENDGRID_API_HOST)?.toLowerCase() ?? "";
  const sg = sgMail as unknown as {
    client: { setDataResidency: (r: "eu" | "global") => void };
    setApiKey: (k: string) => void;
    send: (data: Record<string, unknown>) => Promise<unknown>;
  };
  sg.client.setDataResidency(
    apiHost.includes("eu.sendgrid") ? "eu" : "global"
  );
  sg.setApiKey(apiKey);

  try {
    await sg.send({
      to,
      from: { email: fromEmail, name: fromName },
      replyTo: { email: fromEmail, name: fromName },
      subject,
      text: htmlToPlainSummary(html) || "(see HTML)",
      html,
      mailSettings: { sandboxMode: { enable: false } },
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
      },
      categories: ["waresport-intern-portal"],
    });
  } catch (err: unknown) {
    const r = err as {
      response?: {
        body?: { errors?: { message?: string; field?: string }[] };
      };
      message?: string;
    };
    const errs = r.response?.body?.errors;
    const detail =
      errs
        ?.map((e) => [e.field, e.message].filter(Boolean).join(": "))
        .filter(Boolean)
        .join("; ") ||
      r.message ||
      String(err);
    console.error("SendGrid send failed:", detail);
    throw new Error(`SendGrid: ${detail}`);
  }
}

/**
 * Vercel: SendGrid API only (no SMTP — Gmail/SMTP sockets fail with ESOCKET).
 * Local: SendGrid if configured, otherwise SMTP.
 */
async function sendHtmlEmail(to: string, subject: string, html: string) {
  if (sendGridPartialConfig()) {
    throw new Error(
      "SendGrid requires both SENDGRID_API_KEY and SENDGRID_FROM_EMAIL (see .env.example)."
    );
  }

  if (isDeployedOnVercel()) {
    if (!isSendGridConfigured()) {
      throw new Error(
        "On Vercel, set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL for Production, then redeploy. SMTP is not used in production."
      );
    }
    return sendWithSendGrid(to, subject, html);
  }

  if (isSendGridConfigured()) {
    return sendWithSendGrid(to, subject, html);
  }

  if (isSmtpConfigured()) {
    return sendWithSmtp(to, subject, html);
  }

  throw new Error(
    "Email not configured. For local dev set SMTP_* or SendGrid vars — see .env.example."
  );
}

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Waresport</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#4f46e5;padding:28px 40px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">⚡ Waresport</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f1f1f1;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Waresport Intern Portal &nbsp;·&nbsp; This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function sendWelcomeEmail({
  name,
  email,
  tempPassword,
}: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  const loginUrl = `${baseUrl()}/login`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Welcome to Waresport, ${name}! 🚀</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Your intern account has been created. Use the credentials below to log in and get started.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px;">
                <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">Email</p>
                <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:500;">${email}</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5e7eb;padding-top:12px;">
                <p style="margin:0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">Temporary Password</p>
                <p style="margin:4px 0 0;font-size:16px;color:#111827;font-weight:700;font-family:monospace;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;display:inline-block;">${tempPassword}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      You will be prompted to set a new password when you first log in.
    </p>

    <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
      Log in to the portal &rarr;
    </a>
  `);

  return sendHtmlEmail(
    email,
    `Welcome to Waresport, ${name}! Here are your login details`,
    html
  );
}

export async function sendPasswordResetEmail({
  name,
  email,
  token,
}: {
  name: string;
  email: string;
  token: string;
}) {
  const resetUrl = `${baseUrl()}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${name}, we received a request to reset your Waresport password. Click the button below to choose a new one.
    </p>

    <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
      Reset password &rarr;
    </a>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
      This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>

    <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;">
      Or copy this link into your browser:<br/>
      <span style="color:#6b7280;word-break:break-all;">${resetUrl}</span>
    </p>
  `);

  return sendHtmlEmail(email, "Reset your Waresport password", html);
}

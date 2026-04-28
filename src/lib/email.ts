import nodemailer from "nodemailer";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@waresport.com";

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
  const loginUrl = `${BASE_URL}/login`;

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

  const transport = createTransport();
  return transport.sendMail({
    from: `Waresport <${FROM}>`,
    to: email,
    subject: `Welcome to Waresport, ${name}! Here are your login details`,
    html,
  });
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
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

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

  const transport = createTransport();
  return transport.sendMail({
    from: `Waresport <${FROM}>`,
    to: email,
    subject: "Reset your Waresport password",
    html,
  });
}

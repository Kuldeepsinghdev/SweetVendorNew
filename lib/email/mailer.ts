import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Provider-agnostic SMTP transport.
 *
 * Configure via environment variables (works with SendGrid, AWS SES, Mailgun,
 * Postmark, or any SMTP host):
 *   SMTP_HOST      SMTP server hostname
 *   SMTP_PORT      SMTP port (default 587)
 *   SMTP_USER      SMTP username
 *   SMTP_PASS      SMTP password / API key
 *   SMTP_SECURE    "true" to use implicit TLS (typically port 465)
 *   EMAIL_FROM     From address, e.g. "Sahakar Bharati <no-reply@example.com>"
 *
 * If SMTP is not configured, isEmailConfigured() returns false and callers can
 * fall back to logging (dev-safe) rather than throwing.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  return cachedTransport;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send an email over SMTP. If SMTP is not configured, this logs the message
 * (including any link in the text body) to the server console and resolves
 * without throwing, so local/dev flows work end-to-end without a mail server.
 *
 * Returns true if the message was handed off to the SMTP server, false if it
 * was only logged (unconfigured).
 */
export async function sendMail(input: SendMailInput): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] SMTP not configured — logging instead of sending.\n` +
        `  To: ${input.to}\n  Subject: ${input.subject}\n  ${input.text}`
    );
    return false;
  }

  await getTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  return true;
}

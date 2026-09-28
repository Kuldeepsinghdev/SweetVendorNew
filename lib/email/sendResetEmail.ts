import 'server-only';
import { sendMail } from './mailer';

/**
 * Resolve the app's public base URL for building absolute links in emails.
 * Prefers APP_URL / NEXT_PUBLIC_APP_URL / SITE_URL; falls back to localhost.
 */
export function getAppUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    'http://localhost:3000';
  return raw.replace(/\/+$/, ''); // strip trailing slashes
}

/**
 * Send the password-reset email containing a single-use recovery link.
 * `rawToken` is the un-hashed token (only ever sent here, never stored).
 *
 * Returns true if handed to SMTP, false if only logged (SMTP unconfigured).
 */
export async function sendResetEmail(params: {
  to: string;
  rawToken: string;
  expiresInMinutes: number;
}): Promise<boolean> {
  const { to, rawToken, expiresInMinutes } = params;
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const subject = 'Reset your Sahakar Bharati password';

  const text = [
    'We received a request to reset the password for your Sahakar Bharati account.',
    '',
    'Reset your password using the link below:',
    resetUrl,
    '',
    `This link expires in ${expiresInMinutes} minutes and can be used once.`,
    'If you did not request this, you can safely ignore this email — your password will not change.',
  ].join('\n');

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
    <h2 style="color:#b45309; margin-bottom: 4px;">Reset your password</h2>
    <p style="font-size: 14px; line-height: 1.6;">
      We received a request to reset the password for your <b>Sahakar Bharati</b> account.
    </p>
    <p style="margin: 24px 0;">
      <a href="${resetUrl}"
         style="background:#ea580c; color:#fff; text-decoration:none; font-weight:700;
                padding: 12px 20px; border-radius: 10px; display:inline-block; font-size: 14px;">
        Reset password
      </a>
    </p>
    <p style="font-size: 12px; color:#64748b; line-height: 1.6;">
      Or paste this link into your browser:<br />
      <span style="word-break: break-all;">${resetUrl}</span>
    </p>
    <p style="font-size: 12px; color:#64748b; line-height: 1.6;">
      This link expires in ${expiresInMinutes} minutes and can be used once.
      If you did not request this, you can safely ignore this email — your password will not change.
    </p>
  </div>`;

  return sendMail({ to, subject, html, text });
}

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
 * Send a password email containing a single-use link. `rawToken` is the
 * un-hashed token (only ever sent here, never stored). The `purpose` controls
 * the wording:
 *   - 'reset' : a user requested a password reset.
 *   - 'setup' : a new account (e.g. an approved Sahakar Mitra) needs to choose
 *               its first password.
 *
 * Returns true if handed to SMTP, false if only logged (SMTP unconfigured).
 */
export async function sendResetEmail(params: {
  to: string;
  rawToken: string;
  expiresInMinutes: number;
  purpose?: 'reset' | 'setup';
}): Promise<boolean> {
  const { to, rawToken, expiresInMinutes, purpose = 'reset' } = params;
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const isSetup = purpose === 'setup';
  const subject = isSetup
    ? 'Set your Sahakar Bharati password'
    : 'Reset your Sahakar Bharati password';

  const heading = isSetup ? 'Set your password' : 'Reset your password';
  const lead = isSetup
    ? 'Your Sahakar Mitra account has been approved. Set a password to activate your login.'
    : 'We received a request to reset the password for your Sahakar Bharati account.';
  const cta = isSetup ? 'Set password' : 'Reset password';
  const expiryLine = `This link expires in ${expiresInMinutes} minutes and can be used once.`;
  const footer = isSetup
    ? 'If you were not expecting this, you can ignore this email.'
    : 'If you did not request this, you can safely ignore this email — your password will not change.';

  const text = [
    lead,
    '',
    `${isSetup ? 'Set your password' : 'Reset your password'} using the link below:`,
    resetUrl,
    '',
    expiryLine,
    footer,
  ].join('\n');

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
    <h2 style="color:#b45309; margin-bottom: 4px;">${heading}</h2>
    <p style="font-size: 14px; line-height: 1.6;">${lead}</p>
    <p style="margin: 24px 0;">
      <a href="${resetUrl}"
         style="background:#ea580c; color:#fff; text-decoration:none; font-weight:700;
                padding: 12px 20px; border-radius: 10px; display:inline-block; font-size: 14px;">
        ${cta}
      </a>
    </p>
    <p style="font-size: 12px; color:#64748b; line-height: 1.6;">
      Or paste this link into your browser:<br />
      <span style="word-break: break-all;">${resetUrl}</span>
    </p>
    <p style="font-size: 12px; color:#64748b; line-height: 1.6;">
      ${expiryLine} ${footer}
    </p>
  </div>`;

  return sendMail({ to, subject, html, text });
}

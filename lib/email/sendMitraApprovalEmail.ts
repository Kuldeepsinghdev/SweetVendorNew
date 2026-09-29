import 'server-only';
import { sendMail } from './mailer';
import { getAppUrl } from './sendResetEmail';

/**
 * Send a rich approval email to a newly approved Sahakar Mitra.
 *
 * Sent after approveMitraAction completes. Includes:
 *   - Mitra name and application reference
 *   - Bilingual content (Hindi primary, English secondary)
 *   - Link to the Mitra portal login
 *   - Instructions for setting a password (if a set-password link is provided)
 *   - What to do next
 *
 * Non-fatal: if SMTP is not configured, the mail is logged to console and
 * this function returns false without throwing.
 */
export async function sendMitraApprovalEmail(params: {
  to: string;
  mitraName: string;
  applicationId: string;
  cityNameHi?: string;
  setPasswordUrl?: string; // optional — include if available
}): Promise<boolean> {
  const { to, mitraName, applicationId, cityNameHi, setPasswordUrl } = params;
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/hi/login`;

  const subject = `आपका सहकार मित्र आवेदन स्वीकृत हो गया — ${applicationId}`;

  const text = [
    `प्रिय ${mitraName} जी,`,
    '',
    `बधाई हो! आपका सहकार मित्र आवेदन (${applicationId}) स्वीकृत हो गया है।`,
    cityNameHi ? `आपकी नियुक्ति: ${cityNameHi}` : '',
    '',
    'अगला कदम:',
    setPasswordUrl
      ? `1. नीचे दिए लिंक से अपना पासवर्ड सेट करें: ${setPasswordUrl}`
      : `1. लॉगिन पेज पर जाएँ: ${loginUrl}`,
    '2. अपने मोबाइल नंबर और 4-अंकीय PIN से लॉगिन करें',
    '3. पहली बार लॉगिन पर आप खुद अपना PIN सेट कर सकते हैं',
    '',
    `Congratulations! Your Sahakar Mitra application (${applicationId}) has been approved.`,
    setPasswordUrl ? `Set your password: ${setPasswordUrl}` : `Login at: ${loginUrl}`,
    '',
    '— सहकार भारती राजस्थान / Sahakar Bharati Rajasthan',
  ].filter(Boolean).join('\n');

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
              max-width: 520px; margin: 0 auto; color: #1e293b; border: 1px solid #fde68a;
              border-radius: 16px; overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #78350f, #92400e);
                padding: 24px; text-align: center;">
      <h1 style="color: #fbbf24; font-size: 22px; margin: 0 0 4px 0; font-weight: 900;">
        सहकार भारती
      </h1>
      <p style="color: #fcd34d; font-size: 12px; margin: 0;">Sahakar Bharati Rajasthan</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <h2 style="color: #15803d; font-size: 18px; margin: 0 0 8px 0;">
        🎉 आवेदन स्वीकृत! / Application Approved!
      </h2>
      <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">
        प्रिय ${mitraName} जी,
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.7; margin: 0 0 16px 0;">
        बधाई हो! आपका <strong>सहकार मित्र आवेदन</strong> सफलतापूर्वक स्वीकृत हो गया है।<br/>
        Congratulations! Your Sahakar Mitra application has been approved.
      </p>

      <!-- Application reference -->
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
                  padding: 14px 16px; margin: 0 0 20px 0;">
        <p style="font-size: 11px; color: #92400e; margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase;">
          आवेदन संदर्भ नंबर / Application Reference
        </p>
        <p style="font-size: 22px; font-weight: 900; font-family: monospace;
                  color: #78350f; letter-spacing: 3px; margin: 0;">
          ${applicationId}
        </p>
        ${cityNameHi ? `<p style="font-size: 12px; color: #92400e; margin: 6px 0 0 0;">📍 ${cityNameHi}</p>` : ''}
      </div>

      <!-- Next steps -->
      <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        अगला कदम / Next Steps
      </h3>
      <ol style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0 0 20px 0; padding-left: 18px;">
        ${setPasswordUrl
          ? `<li>नीचे दिए बटन से अपना पासवर्ड सेट करें / Set your password using the button below</li>
             <li>मोबाइल नंबर और पासवर्ड से लॉगिन करें / Login with your mobile number and password</li>`
          : `<li>लॉगिन पेज पर जाएँ / Go to the login page</li>
             <li>अपने मोबाइल नंबर और 4-अंकीय PIN से लॉगिन करें / Login with your mobile number and 4-digit PIN (set on first login)</li>`
        }
        <li>मित्र डैशबोर्ड से बुकिंग करें / Create bookings from your Mitra Dashboard</li>
      </ol>

      <!-- CTA Button -->
      <p style="text-align: center; margin: 0 0 16px 0;">
        <a href="${setPasswordUrl ?? loginUrl}"
           style="background: linear-gradient(135deg, #d97706, #ea580c);
                  color: #ffffff; text-decoration: none; font-weight: 800;
                  padding: 13px 28px; border-radius: 10px; display: inline-block;
                  font-size: 14px; letter-spacing: 0.3px;">
          ${setPasswordUrl ? '🔐 पासवर्ड सेट करें / Set Password' : '🚀 लॉगिन करें / Login Now'}
        </a>
      </p>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6; margin: 0;">
        किसी समस्या के लिए सहकार भारती से संपर्क करें।<br/>
        For any issues, please contact Sahakar Bharati.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center;">
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
        सहकार भारती राजस्थान · Sahakar Bharati Rajasthan
      </p>
    </div>
  </div>`;

  return sendMail({ to, subject, html, text });
}

import 'server-only';
import { sendMail } from './mailer';

/**
 * Send an OTP code via email with localized subject and body.
 * Supports both Hindi and English locales.
 *
 * Returns true if handed to SMTP, false if only logged (SMTP unconfigured).
 */
export async function sendOtpEmail(params: {
  email: string;
  otpCode: string;
  locale: 'en' | 'hi';
  expiresInMinutes?: number;
}): Promise<boolean> {
  const { email, otpCode, locale, expiresInMinutes = 10 } = params;

  // Localized subject
  const subject = locale === 'hi' 
    ? 'आपका Sahakar Bharati OTP'
    : 'Your Sahakar Bharati OTP';

  // Localized content
  const content = locale === 'hi' 
    ? {
        heading: 'आपका वन-टाइम पासवर्ड (OTP)',
        lead: 'आपने एक OTP के लिए अनुरोध किया है। कृपया नीचे दिया गया कोड अपने खाते तक पहुंचने के लिए उपयोग करें।',
        security: 'सुरक्षा सूचना: यह OTP किसी के साथ साझा न करें। कोई भी Sahakar Bharati कर्मचारी आपसे OTP नहीं मांगेगा।',
        expiryLabel: 'इस OTP की वैधता:',
        minutesUnit: 'मिनट',
        footer: 'यदि आपने इस अनुरोध को नहीं बनाया, तो कृपया इस ईमेल को अनदेखा करें।',
      }
    : {
        heading: 'Your One-Time Password (OTP)',
        lead: 'You have requested an OTP. Please use the code below to access your account.',
        security: 'Security Notice: Do not share this OTP with anyone. No Sahakar Bharati staff will ask for your OTP.',
        expiryLabel: 'This OTP is valid for:',
        minutesUnit: 'minutes',
        footer: 'If you did not request this, please ignore this email.',
      };

  // Plain text version
  const text = [
    content.lead,
    '',
    otpCode,
    '',
    content.security,
    '',
    `${content.expiryLabel} ${expiresInMinutes} ${content.minutesUnit}`,
    '',
    content.footer,
  ].join('\n');

  // HTML version with large, prominent OTP display
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
    <h2 style="color:#b45309; margin-bottom: 4px;">${content.heading}</h2>
    <p style="font-size: 14px; line-height: 1.6;">${content.lead}</p>
    
    <!-- Large OTP display -->
    <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="font-size: 12px; color: #92400e; margin: 0 0 8px 0;">${locale === 'hi' ? 'आपका OTP कोड' : 'Your OTP code'}</p>
      <p style="font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #ea580c; margin: 0; font-family: 'Courier New', monospace;">
        ${otpCode}
      </p>
    </div>

    <!-- Validity info -->
    <p style="font-size: 12px; color: #64748b; text-align: center;">
      ${content.expiryLabel}<br />
      <strong>${expiresInMinutes} ${content.minutesUnit}</strong>
    </p>

    <!-- Security notice -->
    <div style="background: #fce7f3; border-left: 4px solid #ec4899; padding: 12px 16px; margin: 20px 0; font-size: 12px; color: #831843; border-radius: 4px; line-height: 1.5;">
      ${content.security}
    </div>

    <!-- Footer -->
    <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
      ${content.footer}
    </p>

    <!-- Support info -->
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      ${locale === 'hi'
        ? 'Sahakar Bharati सहकारी मिठाई वितरण मंच'
        : 'Sahakar Bharati — Cooperative Sweet Distribution Platform'
      }
    </p>
  </div>`;

  return sendMail({
    to: email,
    subject,
    html,
    text,
  });
}

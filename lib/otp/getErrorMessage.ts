/**
 * Get user-friendly, localized error messages for OTP flow errors.
 * Returns messages in Hindi or English based on locale preference.
 *
 * Supported error keys:
 *   - invalid_email: Invalid email format
 *   - user_not_found: Email not registered as Mitra
 *   - rate_limited: Too many OTP requests
 *   - email_send_failed: Failed to send OTP email
 *   - otp_expired: OTP has expired
 *   - otp_invalid: OTP code is incorrect
 *   - otp_max_attempts: Maximum attempts exceeded
 *   - account_inactive: Mitra account is inactive
 *   - otp_not_found: No active OTP found for user
 *
 * @param key - Error key
 * @param locale - 'en' for English, 'hi' for Hindi
 * @returns Localized error message
 */
export function getErrorMessage(key: string, locale: 'en' | 'hi'): string {
  const messages: Record<string, Record<'en' | 'hi', string>> = {
    invalid_email: {
      en: 'Please enter a valid email address.',
      hi: 'कृपया एक वैध ईमेल पता दर्ज करें।',
    },
    user_not_found: {
      en: 'This email is not registered. Please check and try again or apply to become a Mitra.',
      hi: 'यह ईमेल पंजीकृत नहीं है। कृपया जांचें और पुनः प्रयास करें या मित्र बनने के लिए आवेदन करें।',
    },
    rate_limited: {
      en: 'Too many OTP requests. Please wait an hour before trying again.',
      hi: 'बहुत सारे OTP अनुरोध। कृपया फिर से प्रयास करने से पहले एक घंटा प्रतीक्षा करें।',
    },
    email_send_failed: {
      en: 'Failed to send OTP email. Please try again.',
      hi: 'OTP ईमेल भेजने में विफल। कृपया पुनः प्रयास करें।',
    },
    otp_expired: {
      en: 'Your OTP has expired. Please request a new one.',
      hi: 'आपका OTP समाप्त हो गया है। कृपया एक नया अनुरोध करें।',
    },
    otp_invalid: {
      en: 'The OTP you entered is incorrect. Please try again.',
      hi: 'आप जो OTP दर्ज किया है वह गलत है। कृपया पुनः प्रयास करें।',
    },
    otp_max_attempts: {
      en: 'Maximum attempts exceeded. Please request a new OTP.',
      hi: 'अधिकतम प्रयास समाप्त हो गए। कृपया एक नया OTP अनुरोध करें।',
    },
    account_inactive: {
      en: 'Your Mitra account is inactive. Please contact support.',
      hi: 'आपका मित्र खाता निष्क्रिय है। कृपया समर्थन से संपर्क करें।',
    },
    otp_not_found: {
      en: 'No active OTP found. Please request a new one.',
      hi: 'कोई सक्रिय OTP नहीं मिला। कृपया एक नया अनुरोध करें।',
    },
    validation_error: {
      en: 'An error occurred. Please try again.',
      hi: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
    },
  };

  return messages[key]?.[locale] ?? messages.validation_error[locale];
}

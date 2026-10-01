# Mitra OTP Login Guide

## Overview

Sahakar Bharati now supports email-based OTP (One-Time Password) login for Mitras as an alternative to PIN-based authentication. This provides a more convenient and secure way for Mitras to access the platform.

**Status:** Phase 1 — Email OTP only. SMS/Phone OTP coming in Phase 2.

---

## User Flow

### Happy Path

1. **Request OTP**
   - Mitra navigates to `/login`
   - Clicks "Email + OTP" tab
   - Enters registered email address
   - Clicks "Get OTP"
   - Receives 6-digit code via email

2. **Verify OTP**
   - Enters 6-digit code from email
   - Clicks "Verify OTP"
   - System validates OTP (not expired, not max attempts)
   - Session created, redirects to `/mitra/portal`

3. **Access Mitra Portal**
   - Mitra can view catalog, cart, bookings, and other features
   - Session persists across page reloads
   - Clicking logout clears session cookie

### Error Scenarios

- **Invalid Email:** Generic error (no email enumeration), user can retry
- **Rate Limited:** Max 3 OTP requests per email per hour
- **Invalid OTP:** Max 5 attempts per OTP, shows attempts remaining
- **Expired OTP:** OTP valid for 10 minutes (configurable)

---

## Security Features

### Cryptographic OTP Generation
- Uses `crypto.randomInt()` for cryptographically secure random generation
- 6-digit format (000000 to 999999)
- Collision probability: < 0.0001%

### Server-Authoritative Validation
- OTP validation happens entirely on the server
- Client cannot bypass or manipulate OTP checks
- Database records all OTP requests and attempts

### Rate Limiting
- **Per Email:** Max 3 OTP requests per hour
- **Per OTP:** Max 5 verification attempts
- **Prevents:** Brute-force attacks, email enumeration, DoS

### Authorization Checks
- User must have `role = 'mitra'` (approved only, not pending)
- User must have `isActive = true` (account not deactivated)
- User must have registered email address in database

### Audit Logging
- All OTP requests logged (no plaintext codes in logs)
- User email, success/failure, error reason recorded
- Helps detect abuse patterns

### Session Security
- Session cookie: **HttpOnly**, **Secure**, **SameSite=Lax**
- Cannot be accessed by JavaScript (prevents XSS theft)
- Only transmitted over HTTPS in production
- Cleared on logout

---

## Configuration

### Environment Variables

```env
ENABLE_OTP_LOGIN=true                # Enable/disable feature
OTP_EXPIRY_MINUTES=10                # OTP valid for N minutes
BREVO_API_KEY=your-key-here         # Brevo account API key
BREVO_SENDER_EMAIL=noreply@...      # From: address
```

### Database Schema

#### Table: `login_otps`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID | References `users.id` |
| `emailAddress` | VARCHAR | Email used for OTP request |
| `otpCode` | VARCHAR(6) | 6-digit code |
| `method` | VARCHAR | 'email', 'sms' (future) |
| `attempts` | INT | Number of failed attempts |
| `maxAttempts` | INT | Max allowed attempts (5) |
| `createdAt` | TIMESTAMP | When OTP was generated |
| `expiresAt` | TIMESTAMP | When OTP expires |
| `verifiedAt` | TIMESTAMP | When successfully verified |

---

## Enable / Disable OTP Login

### To Enable

```bash
# .env
ENABLE_OTP_LOGIN=true

npm run dev
```

### To Disable

```bash
# .env
ENABLE_OTP_LOGIN=false

npm run dev
```

---

## Testing

### Run Unit Tests

```bash
npm test -- tests/unit/otp.test.ts --run
```

**Coverage:** 32 tests
- OTP generation, expiration, validation
- Error messages (bilingual)
- Crypto security
- Environment configuration

### Run E2E Tests

```bash
# All OTP tests
npx playwright test tests/e2e/auth/otp-login.spec.ts

# Specific test
npx playwright test tests/e2e/auth/otp-login.spec.ts -g "TC-OTP-001"

# Watch mode
npx playwright test tests/e2e/auth/otp-login.spec.ts --watch
```

**Coverage:** 17 tests
- OTP request/verify flow
- Error handling
- Bilingual UI
- Backward compatibility
- Protected routes

---

## Architecture

### Code Structure

```
lib/otp/
├── generateOtpCode.ts          # Crypto-secure 6-digit generation
├── generateOtpId.ts            # UUID for OTP record
├── getOtpExpiration.ts         # Calculate 10-min expiration
├── validateOtp.ts              # Verify OTP, track attempts
├── getErrorMessage.ts          # Localized error messages
└── auditLog.ts                 # Logging (no plaintext codes)

lib/email/
└── sendOtpEmail.ts             # Brevo SMTP, HTML templates

lib/actions/
└── otpAuth.ts                  # requestOtpAction, verifyOtpAction

app/(auth)/login/
├── OtpRequestForm.tsx          # Email input, request logic
├── OtpVerificationForm.tsx     # OTP input, verify logic
└── CustomerLoginForm.tsx       # Tab switcher (Email/PIN)
```

### Server Actions

**`requestOtpAction(email, locale)`**
- Validates email format
- Checks user exists with role='mitra' and isActive=true
- Checks rate limit (3/hour per email)
- Generates OTP, stores in DB
- Sends email via Brevo
- Returns `{ success, error?, otpExpiresAt }`

**`verifyOtpAction(email, otpCode, locale)`**
- Fetches most recent unverified OTP for user
- Validates: not expired, not max attempts, code matches
- If valid: marks verified, creates session, redirects to `/mitra/portal`
- If invalid: increments attempts, returns error

---

## Localization

OTP feature is fully bilingual (English and Hindi):

- Request form: "Email + OTP" / "ईमेल OTP"
- Button: "Get OTP" / "OTP प्राप्त करें"
- Verification form: "Enter OTP" / "OTP दर्ज करें"
- Errors: Localized error messages

---

## Rollback

To quickly disable OTP without code changes:

```bash
# .env
ENABLE_OTP_LOGIN=false

npm run dev
```

For complete rollback, see [OTP_ROLLBACK.md](./OTP_ROLLBACK.md).

---

## FAQ

**Q: Why email instead of SMS?**
A: Email is more reliable, cheaper, doesn't require phone number. SMS in Phase 2.

**Q: Can Mitras use PIN login instead?**
A: Yes! OTP is an alternative. Both methods work.

**Q: How long is OTP valid?**
A: 10 minutes (configurable via OTP_EXPIRY_MINUTES).

**Q: Can I request multiple OTPs?**
A: Yes, max 3 per email per hour.

---

**Last Updated:** October 1, 2024  
**Status:** Phase 1 — Email OTP (Production Ready)

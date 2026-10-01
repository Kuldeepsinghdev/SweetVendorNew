# OTP Login Rollback Guide

## Quick Disable (Recommended)

Disable OTP without code changes:

```bash
# .env
ENABLE_OTP_LOGIN=false

# Restart
npm run dev

# Expected: OTP form hidden, PIN login shown
```

---

## Complete Rollback

To remove OTP code entirely:

### 1. Disable Feature Flag

```bash
# .env
ENABLE_OTP_LOGIN=false
npm run dev
```

### 2. Delete OTP Files

```bash
rm -rf lib/otp
rm -rf tests/unit/otp.test.ts
rm -rf tests/e2e/auth/otp-login.spec.ts
rm docs/OTP_*.md
rm lib/email/sendOtpEmail.ts
```

### 3. Revert Components

```bash
git checkout app/(auth)/login/CustomerLoginForm.tsx
git checkout app/(auth)/login/OtpRequestForm.tsx
git checkout app/(auth)/login/OtpVerificationForm.tsx
```

### 4. Database Cleanup (Optional)

```sql
-- Keep table for audit trail, just delete data
DELETE FROM login_otps;

-- Or drop entirely
DROP TABLE IF EXISTS login_otps;
```

### 5. Commit Rollback

```bash
git add .env lib app tests docs
git commit -m "chore: Rollback OTP login feature

- Set ENABLE_OTP_LOGIN=false
- Deleted OTP code and documentation
- Database table retained for audit
"
```

---

## Re-Enable After Rollback

### Option 1: Quick Re-enable

```bash
# .env
ENABLE_OTP_LOGIN=true
npm run dev
```

### Option 2: From Git History

```bash
git log --oneline | grep -i otp
git checkout <commit-hash> -- lib/otp lib/email/sendOtpEmail.ts lib/actions/otpAuth.ts
echo "ENABLE_OTP_LOGIN=true" >> .env
npm run dev
```

---

## Disaster Recovery

### Database Issue

```bash
# Re-run migrations to recreate table
npm run db:migrate
```

### Session Cookie Lost

1. Disable OTP temporarily
2. Users re-login via PIN
3. Investigate and fix issue
4. Re-enable OTP

---

## Rollback Verification

```bash
# Verify feature disabled
grep ENABLE_OTP_LOGIN .env

# Navigate to /login
# Should see only PIN form, no OTP tab

# Test PIN login works
# Should succeed with valid credentials
```

---

**For quick disable without code changes, just set `ENABLE_OTP_LOGIN=false` and restart.**

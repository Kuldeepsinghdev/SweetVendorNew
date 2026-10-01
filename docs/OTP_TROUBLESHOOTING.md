# OTP Login Troubleshooting Guide

## Common Issues

### OTP Not Received

**Cause:** Email not registered, Mitra not approved, or email service not configured.

**Solutions:**
1. Verify email is registered in database:
   ```sql
   SELECT id, email, role, isActive FROM users WHERE email = 'user@example.com';
   ```

2. Check Brevo configuration in .env file

3. Ask user to check spam folder

4. Verify sender email is not on blocklist

### OTP Expired

**Cause:** OTP valid for 10 minutes only (default).

**Solution:** Request new OTP by clicking "Get OTP" again.

### Too Many Attempts

**Cause:** User entered incorrect OTP 5 times.

**Solution:** Request new OTP. User can check email for original code if needed.

### Rate Limited

**Cause:** User requested 3+ OTPs in past hour.

**Solution:** Wait 1 hour or admin can reset:
```sql
DELETE FROM login_otps 
WHERE email_address = 'user@example.com' 
AND created_at < NOW() - INTERVAL '1 hour';
```

### Inactive Mitra Blocked

**Cause:** Mitra account marked inactive (isActive = false).

**Solution:** Admin reactivates:
```sql
UPDATE users SET isActive = true WHERE id = 'user-id';
```

### Pending Mitra Cannot Login

**Cause:** Mitra status is 'pending' (not yet approved).

**Solution:** Admin approves Mitra application first.

### Session Not Persisting

**Cause:** Session cookie not set or browser rejecting cookies.

**Solution:**
1. Check browser DevTools → Cookies
2. Verify `sahakar_customer` cookie exists with HttpOnly flag
3. Ensure visiting http://localhost:3001 (not https in dev)

### OTP Form Not Visible

**Cause:** Feature flag `ENABLE_OTP_LOGIN=false`.

**Solution:**
```bash
# .env
ENABLE_OTP_LOGIN=true

npm run dev
```

---

## Feature Flag Testing

### Enable OTP

```bash
# .env
ENABLE_OTP_LOGIN=true
npm run dev
# Expected: OTP form visible at /login
```

### Disable OTP

```bash
# .env
ENABLE_OTP_LOGIN=false
npm run dev
# Expected: OTP form hidden
```

---

## Testing Commands

### Unit Tests (32 tests)

```bash
npm test -- tests/unit/otp.test.ts --run
```

### E2E Tests (17 tests)

```bash
npx playwright test tests/e2e/auth/otp-login.spec.ts
```

### Type Check & Build

```bash
npm run typecheck
npm run build
```

---

## Manual Smoke Tests

**Scenario 1:** Happy path (request → verify → redirect)  
**Scenario 2:** Invalid OTP (5 attempts max)  
**Scenario 3:** Rate limiting (3 requests/hour)  
**Scenario 4:** Bilingual UI (Hindi + English)  
**Scenario 5:** Backward compatibility (PIN login still works)  

---

## Database Cleanup

### Delete Expired OTPs

```sql
DELETE FROM login_otps 
WHERE expires_at < NOW() AND verified_at IS NULL;
```

### Check Pending OTPs

```sql
SELECT id, email_address, attempts, created_at, expires_at
FROM login_otps 
WHERE verified_at IS NULL 
LIMIT 20;
```

---

## Quick Disable

```bash
# .env
ENABLE_OTP_LOGIN=false

npm run dev
# OTP feature disabled, PIN login shown
```

---

**For complete rollback, see [OTP_ROLLBACK.md](./OTP_ROLLBACK.md).**

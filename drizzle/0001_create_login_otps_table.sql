-- Create login_otps table for Mitra OTP login flow
CREATE TABLE IF NOT EXISTS login_otps (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  email_address TEXT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  method VARCHAR(32) NOT NULL DEFAULT 'email',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  CONSTRAINT otp_code_format CHECK (otp_code ~ '^\d{6}$')
);

-- Index for efficient lookups during verification flow
CREATE INDEX IF NOT EXISTS login_otps_user_method_idx 
  ON login_otps(user_id, method);

-- Index for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS login_otps_expires_at_idx 
  ON login_otps(expires_at);

-- Composite index for most common query: find active OTP for user
CREATE INDEX IF NOT EXISTS login_otps_user_active_idx 
  ON login_otps(user_id, verified_at DESC NULLS FIRST, expires_at DESC);

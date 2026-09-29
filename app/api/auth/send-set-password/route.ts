import { NextRequest, NextResponse } from 'next/server';
import { issuePasswordEmail } from '@/lib/auth/issuePasswordReset';

/**
 * POST /api/auth/send-set-password
 * Body: { email: string }
 *
 * Sends a "set your password" link to a provisioned account (e.g. a newly
 * approved Sahakar Mitra). Reuses the single-use token flow with a longer
 * expiry and setup-specific email wording.
 *
 * Like the reset endpoint, this always returns a generic 200 and only sends if
 * an active user with that email exists — so it can't be used to probe which
 * emails are registered.
 */
export async function POST(request: NextRequest) {
  const genericOk = () =>
    NextResponse.json({
      success: true,
      message: 'If the account exists, a set-password link has been sent.',
    });

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? '');
    await issuePasswordEmail({ email, purpose: 'setup' });
    return genericOk();
  } catch (error) {
    console.error('send-set-password error:', error);
    return genericOk();
  }
}

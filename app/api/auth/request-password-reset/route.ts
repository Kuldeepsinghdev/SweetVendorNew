import { NextRequest, NextResponse } from 'next/server';
import { issuePasswordEmail } from '@/lib/auth/issuePasswordReset';

/**
 * POST /api/auth/request-password-reset
 * Body: { email: string }
 *
 * Starts the self-serve password-reset flow. Always responds 200 with a generic
 * message so the endpoint never reveals whether an email is registered
 * (prevents account enumeration). If a matching active user exists, a
 * single-use token is created and a reset link is emailed.
 */
export async function POST(request: NextRequest) {
  const genericOk = () =>
    NextResponse.json({
      success: true,
      message:
        'If an account exists for that email, a password reset link has been sent.',
    });

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? '');
    await issuePasswordEmail({ email, purpose: 'reset' });
    return genericOk();
  } catch (error) {
    console.error('request-password-reset error:', error);
    // Even on unexpected errors, avoid leaking information.
    return genericOk();
  }
}

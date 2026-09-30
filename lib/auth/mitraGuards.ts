import 'server-only';
import { getCustomerSession, type CustomerSessionUser } from './customerSession';

/**
 * Authorization error for Mitra-specific guards.
 */
export class MitraAuthorizationError extends Error {
  constructor(message = 'Not authorized as Mitra') {
    super(message);
    this.name = 'MitraAuthorizationError';
  }
}

/**
 * Verify that the current user is an authenticated Mitra.
 * Returns the session or null if not authenticated/not a mitra.
 */
export async function requireMitra(): Promise<CustomerSessionUser | null> {
  const session = await getCustomerSession();
  if (!session || session.role !== 'mitra') {
    return null;
  }
  return session;
}

/**
 * Enforce that the current user is an authenticated Mitra.
 * Throws MitraAuthorizationError if not.
 */
export async function requireMitraOrThrow(): Promise<CustomerSessionUser> {
  const session = await requireMitra();
  if (!session) {
    throw new MitraAuthorizationError(
      'केवल अधिकृत सहकार मित्र इस क्रिया को कर सकते हैं। / Only authorized Sahakar Mitras may perform this action.'
    );
  }
  return session;
}

/**
 * Extract the authenticated Mitra's user ID from the session.
 * Useful for server-side filtering queries to ensure data isolation.
 */
export async function getMitraIdFromSession(): Promise<string | null> {
  const session = await requireMitra();
  return session?.sub ?? null;
}

/**
 * Verify that a given user ID matches the authenticated Mitra's ID.
 * Used to prevent one Mitra from accessing another's data.
 *
 * @param givenMitraId The user ID to verify (e.g., from a booking or invoice)
 * @returns true if the authenticated Mitra owns this resource
 */
export async function verifyMitraOwnership(givenMitraId: string): Promise<boolean> {
  const authenticatedId = await getMitraIdFromSession();
  return authenticatedId === givenMitraId;
}

/**
 * Guard for Server Actions and API routes that require Mitra role and ownership.
 * Verifies:
 * 1. User is authenticated as Mitra
 * 2. User owns the requested resource (optional, pass givenMitraId if needed)
 *
 * @throws MitraAuthorizationError if not authorized
 */
export async function requireMitraOwnershipOrThrow(
  givenMitraId?: string
): Promise<CustomerSessionUser> {
  const session = await requireMitraOrThrow();

  if (givenMitraId && session.sub !== givenMitraId) {
    throw new MitraAuthorizationError(
      'आप इस संसाधन को एक्सेस नहीं कर सकते। / You do not have permission to access this resource.'
    );
  }

  return session;
}

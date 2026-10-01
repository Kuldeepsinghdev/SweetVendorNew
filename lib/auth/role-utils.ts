import type { AdminRole } from './session';

/**
 * Role hierarchy: a higher-privileged role satisfies checks for lower ones.
 * super_admin ⊇ city_admin ⊇ kendra
 * 
 * Pure utility function — no server-only requirement, safe to use in client components.
 */
const ROLE_RANK: Record<AdminRole, number> = {
  kendra: 1,
  city_admin: 2,
  super_admin: 3,
};

export function roleSatisfies(actual: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

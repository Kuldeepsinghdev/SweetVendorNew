/**
 * Legacy import path shim.
 *
 * The canonical database client now lives at `@/lib/db`. This module used to
 * construct its own postgres-js pool, which meant two independent pools ran per
 * process. It now re-exports the single canonical client so every `@/src/db`
 * importer (the interim API route handlers) shares one connection pool.
 *
 * Prefer importing from `@/lib/db` in new code; this re-export exists only to
 * keep the existing route handlers working during the migration.
 */
export { db, schema } from '@/lib/db';

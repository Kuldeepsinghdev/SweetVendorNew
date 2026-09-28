// Loads environment variables. This module must be imported FIRST (before any
// module that reads process.env at load time, e.g. src/db/index.ts).
//
// In ES modules all `import` statements are hoisted and evaluated before the
// importing module's body runs. Putting dotenv.config() in an imported module
// guarantees env vars are populated before the db client is constructed.
import dotenv from 'dotenv';

dotenv.config();
// Fallback template values (real values in .env take precedence, no override).
dotenv.config({ path: '.env.example' });

import './../src/env';
import { db } from '../src/db/index';
import * as schema from '../src/db/schema';
import fs from 'fs';
import path from 'path';

async function main() {
  const tables: [string, any][] = [
    ['users', schema.users],
    ['master_sweets', schema.masterSweets],
    ['cities', schema.cities],
    ['sale_centers', schema.saleCenters],
    ['distribution_centers', schema.distributionCenters],
    ['festivals', schema.festivals],
    ['mitra_applications', schema.mitraApplications],
    ['bookings', schema.bookings],
    ['discounts', schema.discounts],
    ['audit_logs', schema.auditLogs],
    ['notification_templates', schema.notificationTemplates],
  ];

  const dump: Record<string, any[]> = {};
  for (const [name, table] of tables) {
    try {
      dump[name] = await db.select().from(table);
    } catch (e) {
      dump[name] = [];
      console.warn(`Skipped ${name}:`, (e as Error).message);
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `db-backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));

  const counts = Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, v.length]));
  console.log('Backup written to:', file);
  console.table(counts);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db } from '../lib/db/index.js';
import { masterSweets } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

interface BackupMasterSweet {
  id: string;
  nameHi: string;
  nameEn: string;
  category: string;
  hsnCode: string;
  gstPercent: number;
  descriptionHi: string;
  descriptionEn: string;
  imageUrl: string;
  images?: string[];
  basePrice: number;
  discountPercent: number | null;
  shelfLifeDays: number;
  packSizeInfo: string;
  variants: Array<{
    label: string;
    price: number;
    weightInKg: number;
  }>;
  isPureVeg: boolean;
  ingredientsHi: string;
}

async function restoreMasterSweets() {
  try {
    // Read the backup file
    const backupPath = resolve(process.cwd(), 'backups/db-backup-2026-09-28T19-53-12-848Z.json');
    const backupContent = readFileSync(backupPath, 'utf-8');
    const backup = JSON.parse(backupContent) as { master_sweets: BackupMasterSweet[] };

    if (!backup.master_sweets || backup.master_sweets.length === 0) {
      console.log('No master_sweets found in backup file');
      process.exit(0);
    }

    console.log(`Found ${backup.master_sweets.length} master sweets in backup`);

    // Transform and insert each sweet
    for (const sweet of backup.master_sweets) {
      // Transform variants format: backup has price, database expects price to be stored in variant
      const transformedVariants = sweet.variants.map((v: any) => ({
        label: v.label,
        weightInKg: v.weightInKg,
        price: v.price,
      }));

      const data = {
        id: sweet.id,
        nameHi: sweet.nameHi,
        nameEn: sweet.nameEn,
        category: sweet.category,
        hsnCode: sweet.hsnCode,
        gstPercent: sweet.gstPercent,
        descriptionHi: sweet.descriptionHi,
        descriptionEn: sweet.descriptionEn,
        imageUrl: sweet.imageUrl,
        images: sweet.images || [sweet.imageUrl],
        basePrice: sweet.basePrice,
        discountPercent: sweet.discountPercent,
        shelfLifeDays: sweet.shelfLifeDays,
        packSizeInfo: sweet.packSizeInfo,
        variants: transformedVariants,
        isPureVeg: sweet.isPureVeg,
        ingredientsHi: sweet.ingredientsHi,
      };

      // Check if sweet already exists
      const existing = await db
        .select()
        .from(masterSweets)
        .where(eq(masterSweets.id, sweet.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(masterSweets)
          .set(data)
          .where(eq(masterSweets.id, sweet.id));
        console.log(`✓ Updated: ${sweet.nameEn} (${sweet.id})`);
      } else {
        // Insert new
        await db.insert(masterSweets).values(data);
        console.log(`✓ Inserted: ${sweet.nameEn} (${sweet.id})`);
      }
    }

    console.log(`\n✅ Successfully restored ${backup.master_sweets.length} master sweets to the database`);
    process.exit(0);
  } catch (error) {
    console.error('Error restoring master sweets:', error);
    process.exit(1);
  }
}

// Run the restoration
restoreMasterSweets();

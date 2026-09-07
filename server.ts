import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.example' });

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index';
import * as schema from './src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { seedDatabase } from './src/db/seed';
import { ensureTablesExist } from './src/db/initDb';
import { supabase } from './src/db/supabaseClient';
import { zohoPaymentsRouter } from './server/zohoPayments';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure tables exist and seed DB on server boot
  ensureTablesExist().catch((err) => console.error('Auto-init/seed error:', err));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Zoho Payments Gateway Integration routes
  app.use('/api/zoho-payments', zohoPaymentsRouter);
  // Alias for generic payment session endpoint
  app.post('/api/create-payment-session', (req, res, next) => {
    req.url = '/create-session';
    zohoPaymentsRouter(req, res, next);
  });

  // High-reliability Image Proxy with local asset acceleration
  app.get('/api/image-proxy', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('Missing url parameter');
    }

    // Direct fast-path mapping to local downloaded high-res assets
    if (rawUrl.includes('Moong-Dal-Burfi') || rawUrl.includes('anandams.com')) {
      return res.sendFile(path.join(process.cwd(), 'public', 'images', 'moong_barfi_anandam.jpg'));
    }
    if (rawUrl.includes('mt-1771412570') || rawUrl.includes('indiatv.in')) {
      return res.sendFile(path.join(process.cwd(), 'public', 'images', 'mathri_indiatv.webp'));
    }
    if (rawUrl.includes('p95T_AH9o') || (rawUrl.includes('bing.com') && rawUrl.includes('kaju'))) {
      return res.sendFile(path.join(process.cwd(), 'public', 'images', 'kaju_katli_bing.webp'));
    }

    try {
      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        return res.status(response.status).send('Unable to fetch image');
      }
      const cType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', cType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (e: any) {
      console.error('Image proxy error:', e.message);
      return res.status(500).send('Image proxy error');
    }
  });

  // Supabase Storage Diagnostic & Repair Utility
  app.get('/api/diagnose-supabase-storage', async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({
          status: 'error',
          message: 'Supabase client is not configured. Missing SUPABASE_URL or SUPABASE_KEY in environment.',
          environmentConfigured: false
        });
      }

      // 1. List buckets
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      // 2. Check if 'sweets' bucket exists
      let sweetsBucket: any = buckets?.find((b: any) => b.name === 'sweets' || b.id === 'sweets');
      let createdBucket = false;

      if (!sweetsBucket && !bucketError) {
        // Attempt to create public 'sweets' bucket
        const { data: newB, error: createErr } = await supabase.storage.createBucket('sweets', {
          public: true,
          fileSizeLimit: 10485760
        });
        if (!createErr) {
          createdBucket = true;
          sweetsBucket = { name: 'sweets', public: true };
        }
      }

      // 3. List files in 'sweets' bucket
      const { data: files, error: filesError } = await supabase.storage.from('sweets').list();

      // 4. Test Public URL formatting
      const sampleFileName = files && files.length > 0 ? files[0].name : 'kaju_katli_dmb_1785830397687.jpg';
      const publicUrl = supabase.storage.from('sweets').getPublicUrl(sampleFileName).data.publicUrl;

      res.json({
        status: 'success',
        supabaseConfigured: true,
        bucketCheck: {
          bucketName: 'sweets',
          exists: !!sweetsBucket,
          isPublic: sweetsBucket?.public ?? true,
          createdBucketNow: createdBucket,
          totalBucketsFound: buckets?.length || 0,
          bucketsList: buckets?.map((b: any) => ({ name: b.name, public: b.public })),
          error: bucketError ? bucketError.message : null
        },
        filesCheck: {
          totalFiles: files?.length || 0,
          sampleFiles: files?.slice(0, 10).map((f: any) => f.name) || [],
          error: filesError ? filesError.message : null
        },
        urlFormatting: {
          bucket: 'sweets',
          sampleFileName,
          formattedPublicUrl: publicUrl,
          pattern: `${process.env.SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co'}/storage/v1/object/public/sweets/{filename}`
        }
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Seed & Reset endpoint
  app.post(['/api/seed', '/api/reset-data'], async (req, res) => {
    try {
      await ensureTablesExist();
      await seedDatabase(true);
      res.json({ success: true, message: 'Database initialized & seeded successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1. MASTER SWEETS CRUD
  app.get('/api/master-sweets', async (req, res) => {
    try {
      const data = await db.select().from(schema.masterSweets);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/master-sweets', async (req, res) => {
    try {
      const sweet = req.body;
      const result = await db.insert(schema.masterSweets).values(sweet).onConflictDoUpdate({
        target: schema.masterSweets.id,
        set: sweet,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/master-sweets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const sweet = req.body;
      const result = await db.update(schema.masterSweets).set(sweet).where(eq(schema.masterSweets.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/master-sweets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.masterSweets).where(eq(schema.masterSweets.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. CITIES CRUD
  app.get('/api/cities', async (req, res) => {
    try {
      const data = await db.select().from(schema.cities);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cities', async (req, res) => {
    try {
      const city = req.body;
      const result = await db.insert(schema.cities).values(city).onConflictDoUpdate({
        target: schema.cities.id,
        set: city,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/cities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const city = req.body;
      const result = await db.update(schema.cities).set(city).where(eq(schema.cities.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/cities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.cities).where(eq(schema.cities.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. SALE CENTERS CRUD
  app.get('/api/sale-centers', async (req, res) => {
    try {
      const data = await db.select().from(schema.saleCenters);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sale-centers', async (req, res) => {
    try {
      const center = req.body;
      const result = await db.insert(schema.saleCenters).values(center).onConflictDoUpdate({
        target: schema.saleCenters.id,
        set: center,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/sale-centers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const center = req.body;
      const result = await db.update(schema.saleCenters).set(center).where(eq(schema.saleCenters.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/sale-centers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.saleCenters).where(eq(schema.saleCenters.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. FESTIVALS CRUD
  app.get('/api/festivals', async (req, res) => {
    try {
      const data = await db.select().from(schema.festivals);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/festivals', async (req, res) => {
    try {
      const festival = req.body;
      const result = await db.insert(schema.festivals).values(festival).onConflictDoUpdate({
        target: schema.festivals.id,
        set: festival,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/festivals/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const festival = req.body;
      const result = await db.update(schema.festivals).set(festival).where(eq(schema.festivals.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/festivals/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.festivals).where(eq(schema.festivals.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. MITRA APPLICATIONS CRUD
  app.get('/api/mitra-applications', async (req, res) => {
    try {
      const data = await db.select().from(schema.mitraApplications);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/mitra-applications', async (req, res) => {
    try {
      const appData = req.body;
      const result = await db.insert(schema.mitraApplications).values(appData).onConflictDoUpdate({
        target: schema.mitraApplications.id,
        set: appData,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/mitra-applications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const appData = req.body;
      const result = await db.update(schema.mitraApplications).set(appData).where(eq(schema.mitraApplications.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/mitra-applications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.mitraApplications).where(eq(schema.mitraApplications.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. BOOKINGS CRUD
  app.get('/api/bookings', async (req, res) => {
    try {
      const data = await db.select().from(schema.bookings);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const booking = req.body;
      const result = await db.insert(schema.bookings).values(booking).onConflictDoUpdate({
        target: schema.bookings.id,
        set: booking,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/bookings/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const booking = req.body;
      const result = await db.update(schema.bookings).set(booking).where(eq(schema.bookings.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/bookings/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.bookings).where(eq(schema.bookings.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. AUDIT LOGS
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const data = await db.select().from(schema.auditLogs);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/audit-logs', async (req, res) => {
    try {
      const log = req.body;
      const result = await db.insert(schema.auditLogs).values(log).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. NOTIFICATION TEMPLATES
  app.get('/api/notification-templates', async (req, res) => {
    try {
      const data = await db.select().from(schema.notificationTemplates);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/notification-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const template = req.body;
      const result = await db.update(schema.notificationTemplates).set(template).where(eq(schema.notificationTemplates.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. DISCOUNTS & COUPONS
  app.get('/api/discounts', async (req, res) => {
    try {
      const { cityId } = req.query;
      let query = db.select().from(schema.discounts);
      let data = await query;
      if (cityId) {
        data = data.filter((d: any) => d.cityId === 'all' || d.cityId === cityId);
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/discounts', async (req, res) => {
    try {
      const coupon = req.body;
      const couponId = coupon.id || `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const payload = {
        ...coupon,
        id: couponId,
        code: (coupon.code || '').trim().toUpperCase(),
        timesUsed: coupon.timesUsed || 0,
        createdAt: coupon.createdAt || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      };
      const result = await db.insert(schema.discounts).values(payload).onConflictDoUpdate({
        target: schema.discounts.id,
        set: payload,
      }).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/discounts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.code) {
        updates.code = updates.code.trim().toUpperCase();
      }
      const result = await db.update(schema.discounts).set(updates).where(eq(schema.discounts.id, id)).returning();
      res.json(result[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/discounts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.discounts).where(eq(schema.discounts.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/discounts/:id/use', async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await db.select().from(schema.discounts).where(eq(schema.discounts.id, id));
      if (existing.length > 0) {
        const nextUsed = (existing[0].timesUsed || 0) + 1;
        const result = await db.update(schema.discounts).set({ timesUsed: nextUsed }).where(eq(schema.discounts.id, id)).returning();
        return res.json(result[0]);
      }
      res.status(404).json({ error: 'Coupon not found' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Static routes for images
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  app.use('/images', express.static(path.join(process.cwd(), 'src/assets/images')));
  app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

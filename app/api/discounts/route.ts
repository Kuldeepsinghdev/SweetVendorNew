import { NextRequest } from 'next/server';
import { db } from '@/src/db';
import { discounts } from '@/src/db/schema';
import { handle, ok, nowStamp } from '@/lib/api/handler';

export async function GET(request: NextRequest) {
  return handle(async () => {
    const cityId = request.nextUrl.searchParams.get('cityId');
    let data = await db.select().from(discounts);
    // 'all'-scoped coupons are always included alongside the requested city.
    if (cityId) {
      data = data.filter((d: any) => d.cityId === 'all' || d.cityId === cityId);
    }
    return ok(data);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const coupon = await request.json();
    const couponId =
      coupon.id || `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      ...coupon,
      id: couponId,
      code: (coupon.code || '').trim().toUpperCase(),
      timesUsed: coupon.timesUsed || 0,
      createdAt: coupon.createdAt || nowStamp(),
    };
    const result = await db
      .insert(discounts)
      .values(payload)
      .onConflictDoUpdate({ target: discounts.id, set: payload })
      .returning();
    return ok(result[0]);
  });
}

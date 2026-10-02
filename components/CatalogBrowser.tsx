'use client';

/**
 * CatalogBrowser — the interactive public catalog, ported OUT of the SPA view
 * `src/views/CommonLandingView.tsx` into a standalone, prop-driven client
 * island for the Next.js App Router.
 *
 * MIGRATION NOTES (this is a Vite-SPA → Next.js port):
 *  - NO React Context. The SPA read everything from `useApp()`; here all data
 *    arrives as props and all selection/UI state is local `useState`.
 *  - NO cart / addToCart / customer login here. The SPA gated add-to-cart
 *    behind a Mitra login and maintained an in-context cart. The cart +
 *    customer session are ported in a LATER task (Task 7). Until then, every
 *    booking CTA ("Add to cart" / "Buy now") routes to the Mitra portal.
 *  - The floating sticky cart bar and the "added to cart" toast are removed
 *    entirely (there is no cart yet).
 *  - City and sale-center selection is persisted locally for returning visitors.
 *
 * Markup, Tailwind classes, and the bilingual Hindi/English strings are kept
 * verbatim from the SPA view. The SPA used `language === 'hi'`; here we derive
 * `const hi = locale === 'hi'` and use `hi ? ... : ...`.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  MapPin,
  Clock,
  AlertTriangle,
  PhoneCall,
  ShoppingBag,
  Plus,
  Minus,
  Store,
  Users,
  Search,
  Info,
} from 'lucide-react';
import { CachedImage } from './CachedImage';
import { useCart } from './cart/CartProvider';
import type { Locale } from '@/src/lib/locale';
import type {
  CatalogSweet,
  CatalogCity,
  CatalogSaleCenter,
  CatalogDistributionCenter,
  CatalogSaleCenterSweet,
} from '@/lib/data/catalog';

interface CatalogBrowserProps {
  locale: Locale;
  sweets: CatalogSweet[];
  cities: CatalogCity[];
  saleCenters: CatalogSaleCenter[];
  distributionCenters: CatalogDistributionCenter[];
  saleCenterSweets: CatalogSaleCenterSweet[];
  isBookingWindowOpen: boolean;
  /** Locale-prefixed href for the Mitra portal, e.g. `/hi/mitra`. */
  mitraHref: string;
  /** Locale-prefixed href for the admin portal, e.g. `/hi/admin`. */
  adminHref: string;
  /** Locale-prefixed checkout href, e.g. `/hi/checkout`. */
  checkoutHref: string;
  /** Whether the signed-in user has the mitra role (server-resolved). */
  isMitra: boolean;
  showCenterDirectory?: boolean;
  showRolePortals?: boolean;
}

/**
 * The Drizzle `variants` column is typed as `{ label; weightInKg }[]` and does
 * NOT declare a per-variant `price`. The SPA's `WeightVariant` allowed an
 * optional fixed `price`, and the contract's unit-price formula still references
 * it (`variant.price ?? Math.round(pricePerKg * weightInKg)`). We model that
 * here defensively: a variant may carry an optional numeric `price` at runtime.
 */
type CatalogVariant = CatalogSweet['variants'][number] & { price?: number };

export function CatalogBrowser(props: CatalogBrowserProps) {
  const {
    locale,
    sweets,
    cities,
    saleCenters,
    distributionCenters,
    saleCenterSweets,
    mitraHref,
    adminHref,
    checkoutHref,
    isMitra,
    showCenterDirectory = true,
    showRolePortals = true,
  } = props;

  const hi = locale === 'hi';
  const router = useRouter();
  const cart = useCart();
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Per-sale-centre sweet menu lookup, replacing the SPA's
  // `getSaleCenterSweets(id)` context helper with an in-memory filter.
  const getSaleCenterSweets = (saleCenterId: string): CatalogSaleCenterSweet[] =>
    saleCenterSweets.filter((s) => s.saleCenterId === saleCenterId);

  // ── Local selection state (was AppContext in the SPA) ──────────────────────
  const firstActiveCity = cities.find((c) => c.isActive) || cities[0];
  const [activeCityId, setActiveCityId] = useState<string>(firstActiveCity?.id || '');
  const [activeSaleCenterId, setActiveSaleCenterId] = useState<string>('');
  const [activeDistributionCenterId, setActiveDistributionCenterId] = useState<string>('');

  // ── Pure UI state ──────────────────────────────────────────────────────────
  const [sweetSearchQuery, setSweetSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSweetDetail, setSelectedSweetDetail] = useState<CatalogSweet | null>(null);

  // Onboarding picker. Two-step flow: (1) choose delivery area (city), then
  // (2) choose the sweet shop (sale centre). MIGRATION: persistence via
  // localStorage is dropped — `hasCompletedPicker` defaults to false.
  const [pickerStep, setPickerStep] = useState<'city' | 'shop'>('city');
  const [pickerCityId, setPickerCityId] = useState<string>('');
  const [hasCompletedPicker, setHasCompletedPicker] = useState<boolean>(false);
  const [selectionReady, setSelectionReady] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('sahakar_catalog_selection_v1');
      if (saved) {
        const selection = JSON.parse(saved) as { cityId?: string; saleCenterId?: string };
        const city = cities.find((candidate) => candidate.id === selection.cityId && candidate.isActive);
        const center = saleCenters.find(
          (candidate) =>
            candidate.id === selection.saleCenterId &&
            candidate.cityId === city?.id &&
            candidate.isActive
        );

        if (city && center) {
          setActiveCityId(city.id);
          setActiveSaleCenterId(center.id);
          setPickerCityId(city.id);
          setHasCompletedPicker(true);
          const firstDc = distributionCenters.find(
            (candidate) => candidate.saleCenterId === center.id && candidate.isActive
          );
          if (firstDc) setActiveDistributionCenterId(firstDc.id);
        } else {
          window.localStorage.removeItem('sahakar_catalog_selection_v1');
        }
      }
    } catch {
      window.localStorage.removeItem('sahakar_catalog_selection_v1');
    }
    setSelectionReady(true);
  }, [cities, saleCenters, distributionCenters]);

  useEffect(() => {
    if (!selectionReady || !hasCompletedPicker) return;

    const city = cities.find((candidate) => candidate.id === activeCityId && candidate.isActive);
    const center = saleCenters.find(
      (candidate) =>
        candidate.id === activeSaleCenterId &&
        candidate.cityId === city?.id &&
        candidate.isActive
    );
    if (!city || !center) return;

    window.localStorage.setItem(
      'sahakar_catalog_selection_v1',
      JSON.stringify({ cityId: city.id, saleCenterId: center.id })
    );
  }, [selectionReady, hasCompletedPicker, activeCityId, activeSaleCenterId, cities, saleCenters]);

  // Selected variant per sweet (mirrors the SPA seed defaults).
  const [selectedVariantBySweet, setSelectedVariantBySweet] = useState<{ [sweetId: string]: string }>({
    kaju_katli_no_vark: '1 kg (एक किलो)',
    moong_barfi: '1 kg (एक किलो)',
    mathri: '1 kg (एक किलो)',
    kesar_ghevar: '1 kg (एक किलो)',
    besan_ladoo: '1 kg (एक किलो)',
    motichoor_ladoo: '1 kg (एक किलो)',
    alwar_milk_cake: '1 kg (एक किलो)',
    gulab_jamun: '1 kg (एक किलो)',
    bikaneri_rasgulla: '1 kg (एक किलो)',
    mix_dry_fruit_bites: '1 kg (एक किलो)',
    kesar_rasmalai: '1 kg (एक किलो)',
  });

  // Quantities per sweet.
  const [quantities, setQuantities] = useState<{ [sweetId: string]: number }>({});

  // ── Selection cascade (ported verbatim from the SPA view) ──────────────────
  const activeCity = cities.find((c) => c.id === activeCityId) || null;

  // Step 1: user picks a delivery area. Apply it, then advance to the shop step.
  const handlePickerCitySelect = (cityId: string) => {
    setPickerCityId(cityId);
    setActiveCityId(cityId);
    setPickerStep('shop');
  };

  // Step 2: user picks a sweet shop (sale centre). Wire up the full selection
  // (sale centre → first active distribution centre) and mark onboarding done.
  const handlePickerShopSelect = (saleCenterId: string) => {
    switchSaleCenter(saleCenterId);
    const firstDc = distributionCenters.find((dc) => dc.saleCenterId === saleCenterId && dc.isActive);
    if (firstDc) {
      setActiveDistributionCenterId(firstDc.id);
    }
    setHasCompletedPicker(true);
  };

  // Reopen the onboarding picker (from the "Change" control) starting at step 1.
  const openPicker = () => {
    setPickerCityId(activeCityId);
    setPickerStep('city');
    setHasCompletedPicker(false);
  };

  // Switch delivery area directly from the header dropdown (after onboarding).
  const handleCitySelection = (cityId: string) => {
    setActiveCityId(cityId);
    const firstSaleCenter = saleCenters.find((center) => center.cityId === cityId && center.isActive);
    if (firstSaleCenter) {
      switchSaleCenter(firstSaleCenter.id);
      const firstDc = distributionCenters.find((dc) => dc.saleCenterId === firstSaleCenter.id && dc.isActive);
      if (firstDc) {
        setActiveDistributionCenterId(firstDc.id);
      }
    }
  };

  // When the sale centre changes, cascade to its first active distribution centre.
  const handleSaleCenterSelection = (saleCenterId: string) => {
    switchSaleCenter(saleCenterId);
    const firstDc = distributionCenters.find((dc) => dc.saleCenterId === saleCenterId && dc.isActive);
    if (firstDc) {
      setActiveDistributionCenterId(firstDc.id);
    }
  };

  const switchSaleCenter = (saleCenterId: string) => {
    if (cart.saleCenterId && cart.saleCenterId !== saleCenterId) {
      cart.clear();
      setAddedNotice(null);
    }
    setActiveSaleCenterId(saleCenterId);
  };

  // Centers in active city.
  const activeCityCenters = saleCenters.filter(
    (c) => c.cityId === (activeCity?.id || activeCityId) && c.isActive
  );
  const primaryCenter = activeCityCenters[0] || (saleCenters && saleCenters[0]);
  const selectedCityCenters = saleCenters.filter((center) => center.cityId === activeCityId && center.isActive);

  // Resolve the effective sale centre for the active city, then its distribution centres.
  const effectiveSaleCenterId = selectedCityCenters.some((c) => c.id === activeSaleCenterId)
    ? activeSaleCenterId
    : selectedCityCenters[0]?.id || '';

  // Sweets are configured per SALE CENTRE (pricing + availability).
  const centerConfiguredSweets = getSaleCenterSweets(effectiveSaleCenterId).filter((s) => s.isActive);
  const centerSweetIds = new Set(centerConfiguredSweets.map((s) => s.sweetId));

  // Filter master sweets strictly by the selected sale centre's menu.
  const citySweetsList = sweets.filter((sweet) => {
    // Must be offered by the active sale centre.
    if (!centerSweetIds.has(sweet.id)) return false;

    // Category filter.
    if (activeCategory !== 'all' && sweet.category !== activeCategory) {
      return false;
    }

    // Search query filter. `ingredientsHi` is nullable in the schema.
    if (sweetSearchQuery.trim() !== '') {
      const q = sweetSearchQuery.toLowerCase();
      const matchNameHi = sweet.nameHi.toLowerCase().includes(q);
      const matchNameEn = sweet.nameEn.toLowerCase().includes(q);
      const matchDesc = sweet.descriptionHi.toLowerCase().includes(q);
      const matchIng = sweet.ingredientsHi?.toLowerCase().includes(q);
      return matchNameHi || matchNameEn || matchDesc || matchIng;
    }

    return true;
  });

  const saleCenterDistributionCenters = distributionCenters.filter(
    (dc) => dc.saleCenterId === effectiveSaleCenterId && dc.isActive
  );
  // Keep the effective DC resolution for parity with the SPA cascade even
  // though the browse-only catalog doesn't render it directly.
  const effectiveDistributionCenterId = saleCenterDistributionCenters.some((dc) => dc.id === activeDistributionCenterId)
    ? activeDistributionCenterId
    : saleCenterDistributionCenters[0]?.id || '';
  void effectiveDistributionCenterId;

  // Active (selectable) delivery areas, and the sweet shops for whichever city
  // is highlighted inside the onboarding picker.
  const activeCities = cities.filter((city) => city.isActive);
  const pickerCityShops = saleCenters.filter(
    (center) => center.cityId === pickerCityId && center.isActive
  );

  // Show the onboarding picker until the user has completed it AND we have a
  // resolvable selection (a valid active city with at least one sweet shop).
  const hasResolvableSelection =
    !!activeCity && activeCity.isActive && selectedCityCenters.length > 0;
  const showOnboardingPicker =
    cities.length > 0 && (!hasCompletedPicker || !hasResolvableSelection);

  // ── Per-sweet helpers ──────────────────────────────────────────────────────
  const getQty = (sweetId: string) => quantities[sweetId] || 1;

  const handleQtyChange = (sweetId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[sweetId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [sweetId]: next };
    });
  };

  const getSelectedVariant = (sweet: CatalogSweet): CatalogVariant => {
    const variants = sweet.variants as CatalogVariant[];
    const selectedLabel = selectedVariantBySweet[sweet.id];
    if (selectedLabel) {
      const found = variants.find((v) => v.label === selectedLabel);
      if (found) return found;
    }
    return variants[0];
  };

  const getVariantLabel = (label: string) =>
    hi ? label : label.replace(' (एक किलो)', '').replace(' (आधा किलो)', '');

  const handleSelectVariant = (sweetId: string, variantLabel: string) => {
    setSelectedVariantBySweet((prev) => ({ ...prev, [sweetId]: variantLabel }));
  };

  // Add a sweet to the storefront cart. Only authenticated Mitras may add items.
  // Non-Mitras (visitors or customer-role users) are sent to the Mitra portal
  // landing page which shows Apply/Login cards. Prices shown here are display-
  // only hints — the server re-prices authoritatively at checkout.
  const handleAddToCart = (sweet: CatalogSweet, expressCheckout: boolean) => {
    if (!isMitra) {
      // Direct non-mitras to the Mitra portal landing (shows apply + login cards)
      router.push(`${mitraHref}?next=${encodeURIComponent(checkoutHref)}`);
      return;
    }
    if (!effectiveSaleCenterId) return;
    const variant = getSelectedVariant(sweet);
    const qty = getQty(sweet.id);
    const centerConfig = centerConfiguredSweets.find((s) => s.sweetId === sweet.id);
    const pricePerKg = centerConfig ? centerConfig.pricePerKg : sweet.basePrice || 700;
    const unitPriceHint =
      variant.price !== undefined ? variant.price : Math.round(pricePerKg * variant.weightInKg);

    cart.addLine({
      sweetId: sweet.id,
      variantLabel: variant.label,
      quantity: qty,
      sweetNameHi: sweet.nameHi,
      sweetNameEn: sweet.nameEn,
      variantKg: variant.weightInKg,
      unitPriceHint,
      imageUrl: sweet.imageUrl,
      saleCenterId: effectiveSaleCenterId,
    });

    if (expressCheckout) {
      router.push(checkoutHref);
      return;
    }
    setAddedNotice(`${hi ? sweet.nameHi : sweet.nameEn} (${variant.label} × ${qty})`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  // First-run onboarding: pick delivery area, then sweet shop. Render ONLY this
  // modal so the main store UI never flashes an "undefined / no sweets" state.
  if (!selectionReady) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="h-5 w-48 rounded bg-amber-100" />
          <div className="mt-4 space-y-2">
            <div className="h-14 rounded-xl bg-slate-100" />
            <div className="h-14 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (showOnboardingPicker) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-amber-300">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`h-1.5 flex-1 rounded-full ${pickerStep === 'city' ? 'bg-orange-600' : 'bg-emerald-500'}`} />
            <span className={`h-1.5 flex-1 rounded-full ${pickerStep === 'shop' ? 'bg-orange-600' : 'bg-slate-200'}`} />
          </div>

          {pickerStep === 'city' ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {hi ? 'अपना डिलीवरी क्षेत्र चुनें' : 'Select your delivery area'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {hi
                      ? 'चरण 1 / 2 — आपके क्षेत्र के अनुसार मिठाइयाँ व दुकानें दिखाई जाएंगी।'
                      : 'Step 1 of 2 — we will show sweets and shops for your area.'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {activeCities.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    {hi ? 'फ़िलहाल कोई सक्रिय डिलीवरी क्षेत्र उपलब्ध नहीं है।' : 'No active delivery areas are available right now.'}
                  </p>
                ) : (
                  activeCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handlePickerCitySelect(city.id)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors cursor-pointer ${
                        city.id === pickerCityId
                          ? 'border-orange-600 bg-orange-50 text-orange-950'
                          : 'border-slate-200 hover:border-orange-400 hover:bg-amber-50 text-slate-800'
                      }`}
                    >
                      <span>
                        <span className="font-bold block">{hi ? city.nameHi : city.nameEn}</span>
                        <span className="text-[11px] text-slate-500">{hi ? city.stateHi : city.stateEn}</span>
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {hi ? 'अपनी मिष्ठान दुकान चुनें' : 'Select your sweet shop'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {hi
                      ? `चरण 2 / 2 — ${cities.find((c) => c.id === pickerCityId)?.nameHi || ''} में उपलब्ध दुकानें`
                      : `Step 2 of 2 — shops available in ${cities.find((c) => c.id === pickerCityId)?.nameEn || ''}`}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {pickerCityShops.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    {hi ? 'इस क्षेत्र में अभी कोई दुकान उपलब्ध नहीं है।' : 'No shops are available in this area yet.'}
                  </p>
                ) : (
                  pickerCityShops.map((shop) => (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handlePickerShopSelect(shop.id)}
                      className="w-full flex items-center justify-between rounded-xl border-2 border-slate-200 hover:border-orange-400 hover:bg-amber-50 text-slate-800 px-4 py-3 text-left transition-colors cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="font-bold block truncate">{hi ? shop.nameHi : shop.nameEn}</span>
                        <span className="text-[11px] text-slate-500 truncate block">{hi ? shop.addressHi : shop.addressEn}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickerStep('city')}
                className="mt-4 text-xs font-bold text-slate-500 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                {hi ? 'डिलीवरी क्षेत्र बदलें' : 'Change delivery area'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 pb-28 sm:pb-16 px-2 sm:px-4">

      {/* Added-to-cart toast — only for authenticated Mitras */}
      {isMitra && addedNotice && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-4 left-3 sm:left-auto z-50 bg-slate-950 text-amber-100 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold animate-in slide-in-from-bottom duration-200">
          <span className="truncate">
            {addedNotice} — {hi ? 'कार्ट में जोड़ा गया!' : 'added to cart!'}
          </span>
          <button
            onClick={() => router.push(checkoutHref)}
            className="px-2.5 sm:px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            {hi ? 'कार्ट →' : 'Cart →'}
          </button>
        </div>
      )}

      {/* Floating cart bar — only for authenticated Mitras */}
      {isMitra && cart.totalItems > 0 && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 sm:w-11/12 max-w-2xl bg-amber-950 text-white p-2.5 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-mono font-black text-xs sm:text-sm shadow shrink-0">
              {cart.totalItems}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold block truncate">
                {cart.totalItems} {hi ? 'मिष्ठान पैक चयनित' : 'items selected'}
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-white truncate">
                {hi ? 'अनुमानित:' : 'Est.:'} ₹{cart.displayTotalHint}/-
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push(checkoutHref)}
            className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow cursor-pointer active:scale-95 shrink-0 flex items-center gap-1"
          >
            <span>{hi ? 'चेकआउट' : 'Checkout'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. CITY SELECTION & STORE CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Active City & Sweet Store Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                  {hi ? `${activeCity?.nameHi} मिष्ठान स्टोर` : `${activeCity?.nameEn} Sweet Store`}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10.5px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  {citySweetsList.length} {hi ? 'मिष्ठान उपलब्ध' : 'sweets available'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {hi ? 'अधिकृत केन्द्र:' : 'Authorized center:'} <span className="font-bold text-amber-950">{hi ? primaryCenter?.nameHi : primaryCenter?.nameEn}</span>
              </p>
            </div>
          </div>

          {/* Delivery area + sweet shop switchers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>{hi ? 'सक्रिय वितरण क्षेत्र:' : 'Active delivery area:'}</span>
            </span>
            <select
              value={activeCityId}
              onChange={(event) => handleCitySelection(event.target.value)}
              aria-label={hi ? 'शहर चुनें' : 'Choose city'}
              className="w-full sm:w-auto sm:min-w-[150px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id} disabled={!city.isActive}>
                  {hi ? city.nameHi : city.nameEn}
                  {!city.isActive ? (hi ? ' (जल्द उपलब्ध)' : ' (Coming soon)') : ''}
                </option>
              ))}
            </select>
            <select
              value={effectiveSaleCenterId}
              onChange={(event) => handleSaleCenterSelection(event.target.value)}
              aria-label={hi ? 'मिष्ठान दुकान चुनें' : 'Choose sweet shop'}
              className="w-full sm:w-auto sm:min-w-[180px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {selectedCityCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {hi ? center.nameHi : center.nameEn}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openPicker}
              className="rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-800 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
            >
              {hi ? 'बदलें' : 'Change'}
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter Chips */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'सभी मिष्ठान (All)' },
              { id: 'dry', label: 'काजू व मेवे' },
              { id: 'traditional', label: 'देशी घी पारंपरिक' },
              { id: 'mawa', label: 'मावा व मिल्क' },
              { id: 'bengali', label: 'रसगुल्ला / बंगाली' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-950 text-amber-200 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sweetSearchQuery}
              onChange={(e) => setSweetSearchQuery(e.target.value)}
              placeholder={hi ? 'मिठाई या घटक खोजें...' : 'Search sweets or ingredients...'}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. CITY SWEETS STORE GRID */}
      {citySweetsList.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 text-center border-2 border-dashed border-amber-300 space-y-3">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 mx-auto" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {hi ? 'चयनित श्रेणी में मिठाई उपलब्ध नहीं है' : 'No sweets available in the selected category'}
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {hi ? 'कृपया दूसरी श्रेणी चुनें या शहर बदलें।' : 'Please choose another category or change the city.'}
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSweetSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs hover:bg-amber-300"
          >
            {hi ? `सभी ${activeCity?.nameHi} मिठाइयाँ देखें` : `View all sweets in ${activeCity?.nameEn}`}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {citySweetsList.map((sweet) => {
            const currentVariant = getSelectedVariant(sweet);
            const currentQty = getQty(sweet.id);
            const centerConfig = centerConfiguredSweets.find((s) => s.sweetId === sweet.id);
            // Price resolution (ported): centre config price, else basePrice
            // (nullable in schema), else the 700 fallback.
            const pricePerKg = centerConfig ? centerConfig.pricePerKg : sweet.basePrice || 700;

            const unitPrice = currentVariant.price !== undefined
              ? currentVariant.price
              : Math.round(pricePerKg * currentVariant.weightInKg);

            const subtotal = unitPrice * currentQty;

            const variants = sweet.variants as CatalogVariant[];

            return (
              <div
                key={sweet.id}
                className="bg-white rounded-2xl border-2 border-amber-300/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-0.5 sm:hover:-translate-y-1"
              >
                <div>
                  {/* Real Sweet Image Container */}
                  <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-100">
                    <CachedImage
                      src={sweet.imageUrl}
                      alt={hi ? sweet.nameHi : sweet.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Pure Desi Ghee Badge */}
                    <span className="absolute top-2 left-2 bg-emerald-800/95 backdrop-blur-xs text-white text-[9.5px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md border border-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      <span>{hi ? '100% गाय का देशी घी' : '100% Pure Cow Ghee'}</span>
                    </span>

                    {/* Shelf Life Badge — shelfLifeDays is nullable in the schema. */}
                    <span className="absolute top-2 right-2 bg-amber-950/90 backdrop-blur-xs text-amber-200 text-[9.5px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md border border-amber-400/40">
                      {sweet.shelfLifeDays} {hi ? 'दिन ताज़ा' : 'days fresh'}
                    </span>

                    {/* Quick Info Button */}
                    <button
                      onClick={() => setSelectedSweetDetail(sweet)}
                      className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-lg shadow-md transition-all cursor-pointer touch-manipulation"
                      title={hi ? 'घटक व विवरण देखें' : 'View ingredients and details'}
                    >
                      <Info className="w-4 h-4 text-orange-700" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-orange-900 transition-colors">
                        {hi ? sweet.nameHi : sweet.nameEn}
                      </h3>
                      <span className="text-[9.5px] sm:text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                        HSN {sweet.hsnCode}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {hi ? sweet.descriptionHi : sweet.descriptionEn}
                    </p>

                    {/* MIGRATION: the schema has only `ingredientsHi` (no
                        `ingredientsEn`), so both locales fall back to it. */}
                    {sweet.ingredientsHi && (
                      <p className="text-[10.5px] text-amber-950 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/70 font-medium line-clamp-1 sm:line-clamp-none">
                        <b>{hi ? 'घटक:' : 'Ingredients:'}</b> {sweet.ingredientsHi}
                      </p>
                    )}
                  </div>
                </div>

                {/* Variants, Stepper & Buy Controls */}
                <div className="p-3.5 sm:p-4 pt-0 border-t border-amber-100 mt-1 space-y-2.5 sm:space-y-3">

                  {/* Variant Selection Buttons (1 kg first, then 500g) */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      {hi ? 'वजन / पैकिंग चुनें:' : 'Choose weight / pack:'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {variants.map((v) => {
                        const isSelected = currentVariant.label === v.label;
                        const vPrice = v.price !== undefined ? v.price : Math.round(pricePerKg * v.weightInKg);
                        return (
                          <button
                            key={v.label}
                            type="button"
                            onClick={() => handleSelectVariant(sweet.id, v.label)}
                            className={`p-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer text-left touch-manipulation min-h-[38px] ${
                              isSelected
                                ? 'bg-amber-950 text-amber-100 border-amber-950 shadow-xs ring-2 ring-amber-400'
                                : 'bg-slate-50 hover:bg-amber-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="truncate text-[11px]">{getVariantLabel(v.label)}</div>
                            <div className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-red-700'}`}>
                              ₹{vPrice}/-
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity Stepper & Price Display */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">{hi ? 'कुल मूल्य' : 'Total price'}</span>
                      <span className="font-mono font-black text-base sm:text-lg text-red-700">
                        ₹{subtotal}/-
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => handleQtyChange(sweet.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer active:scale-95 touch-manipulation"
                        title={hi ? 'कम करें' : 'Decrease quantity'}
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="font-mono font-extrabold text-xs text-slate-900 px-1.5 min-w-[40px] text-center">
                        {currentQty} {hi ? 'पैक' : 'packs'}
                      </span>
                      <button
                        onClick={() => handleQtyChange(sweet.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer active:scale-95 touch-manipulation"
                        title={hi ? 'बढ़ाएं' : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Mitra-only booking controls. Non-Mitras
                      see a sign-in CTA instead of cart buttons. */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {isMitra ? (
                      <>
                        <button
                          onClick={() => handleAddToCart(sweet, false)}
                          className="py-2.5 min-h-[40px] bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-950 border border-amber-300 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3] text-orange-800" />
                          <span>{hi ? 'कार्ट में जोड़ें' : 'Add to cart'}</span>
                        </button>

                        <button
                          onClick={() => handleAddToCart(sweet, true)}
                          className="py-2.5 min-h-[40px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:from-orange-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{hi ? 'तुरंत खरीदें →' : 'Buy now →'}</span>
                        </button>
                      </>
                    ) : (
                      <div className="col-span-2 py-2.5 min-h-[40px] bg-slate-100 text-slate-700 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all touch-manipulation text-center">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {hi ? 'केवल मित्र बुकिंग कर सकते हैं' : 'Only Mitras can book'}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCenterDirectory && !isMitra && <>
      {/* 4. ACTIVE CITY COLLECTION CENTER CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-amber-300/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-red-800 uppercase">
              <Store className="w-4 h-4 text-red-700" />
              <span>{hi ? `${activeCity?.nameHi} — अधिकृत वितरण एवं संग्रह केन्द्र` : `${activeCity?.nameEn} — Authorized Distribution & Pickup Centers`}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {hi ? primaryCenter?.nameHi || 'सहकार मिष्ठान वितरण केन्द्र' : primaryCenter?.nameEn || 'Sahakar Sweets Distribution Center'}
            </h3>
          </div>

          <div className="text-xs font-mono bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-300 font-bold shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            <span>{activeCityCenters.length} सक्रिय संग्रह केन्द्र</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {activeCityCenters.map((center) => (
            <div
              key={center.id}
              className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-200 space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-800">{hi ? 'केन्द्र का नाम' : 'Center name'}</span>
                  <h4 className="font-black text-sm sm:text-base text-slate-900">{hi ? center.nameHi : center.nameEn}</h4>
                </div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                  {center.type === 'standalone' ? 'मुख्य भंडार' : 'सहकार मित्र केंद्र'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                  <span>{hi ? `${center.addressHi} (पिन कोड: ${center.pincode})` : `${center.addressEn} (PIN: ${center.pincode})`}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>संग्रह समय: {center.timing}</span>
                </div>
                {center.ownerPhone && (
                  <div className="flex items-center gap-1.5 text-slate-800 font-mono font-bold">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>हेल्पलाइन: {center.ownerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      </>}

      {showRolePortals && <>
      {/* 5. ROLE PORTALS / QUICK ACCESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Portal: Sahakar Mitra Worker Network */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-300 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-orange-900">सहकार्यकर्ता नेटवर्क</span>
                <h4 className="text-base font-black text-slate-900">सहकार मित्र बनें / मित्र लॉगिन</h4>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              अपने मोहल्ले/सोसायटी के नागरिकों के लिए सामूहिक बुकिंग करें और सहकारिता लाभ प्राप्त करें।
            </p>
          </div>

          {/* MIGRATION: both Mitra CTAs route to the Mitra portal href. */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => router.push(mitraHref)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs cursor-pointer text-center"
            >
              मित्र आवेदन करें
            </button>
            <button
              onClick={() => router.push(mitraHref)}
              className="flex-1 bg-white hover:bg-amber-100 text-orange-950 border border-orange-300 font-bold py-2 px-3 rounded-xl text-xs shadow-xs cursor-pointer text-center"
            >
              मित्र लॉगिन
            </button>
          </div>
        </div>

        {/* Portal: Kendra / Bhandar Manager */}
        <div className="bg-gradient-to-br from-slate-50 to-amber-50/40 p-5 rounded-2xl border border-slate-300 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-slate-700">वितरण केन्द्र प्रबंधन</span>
                <h4 className="text-base font-black text-slate-900">आस्था उपभोक्ता भण्डार पोर्टल</h4>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ग्राहक डिलीवरी OTP सत्यापन, मिष्ठान स्टॉक वितरण एवं बिलिंग हेतु केंद्र लॉगिन करें।
            </p>
          </div>

          {/* MIGRATION: the SPA branched on the in-context user role; here the
              Kendra portal always routes to the admin portal href. */}
          <button
            onClick={() => router.push(adminHref)}
            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs cursor-pointer text-center"
          >
            केंद्र लॉगिन पोर्टल →
          </button>
        </div>
      </div>
      </>}

      {/* MIGRATION: the SPA's floating sticky cart bar is intentionally removed —
          there is no cart yet (see Task 7). */}

      {/* Sweet Detail Modal */}
      {selectedSweetDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border-2 border-amber-400 animate-in zoom-in-95 duration-200">
            <div className="relative h-48 w-full rounded-2xl overflow-hidden">
              <CachedImage
                src={selectedSweetDetail.imageUrl}
                alt={hi ? selectedSweetDetail.nameHi : selectedSweetDetail.nameEn}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ● 100% गाय का देशी घी
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{hi ? selectedSweetDetail.nameHi : selectedSweetDetail.nameEn}</h3>
              <p className="text-xs text-slate-600 mt-1">{hi ? selectedSweetDetail.descriptionHi : selectedSweetDetail.descriptionEn}</p>
            </div>

            {selectedSweetDetail.ingredientsHi && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
                <b className="block mb-0.5">सामग्री व घटक:</b>
                {selectedSweetDetail.ingredientsHi}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-100 p-2 rounded-xl text-center">
                <span className="text-slate-500 block text-[10px]">ताज़गी अवधि</span>
                <b>{selectedSweetDetail.shelfLifeDays} दिन</b>
              </div>
              <div className="bg-slate-100 p-2 rounded-xl text-center">
                <span className="text-slate-500 block text-[10px]">GST दर</span>
                <b>{selectedSweetDetail.gstPercent}% (HSN {selectedSweetDetail.hsnCode})</b>
              </div>
            </div>

            <button
              onClick={() => setSelectedSweetDetail(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

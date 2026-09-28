/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CachedImage } from '../components/CachedImage';
import { LoginModal } from '../components/LoginModal';
import { MasterSweet, UserRole } from '../types';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  PhoneCall,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Store,
  Building2,
  Users,
  Search,
  CheckCircle2,
  ChevronDown,
  Info,
  ExternalLink,
  Flame
} from 'lucide-react';

interface CommonLandingViewProps {
  onStartCustomerFlow: () => void;
  onStartMitraFlow: () => void;
  onMitraLoginClick: () => void;
}

export const CommonLandingView: React.FC<CommonLandingViewProps> = ({
  onStartCustomerFlow,
  onStartMitraFlow,
  onMitraLoginClick
}) => {
  const {
    language,
    activeFestival,
    isBookingWindowOpen,
    currentUser,
    masterSweets,
    activeCity,
    activeCityId,
    setActiveCityId,
    activeCenterId,
    setActiveCenterId,
    activeSaleCenterId,
    setActiveSaleCenterId,
    activeDistributionCenterId,
    setActiveDistributionCenterId,
    cities,
    saleCenters,
    distributionCenters,
    getSaleCenterSweets,
    addToCart,
    cart,
    setRole
  } = useApp();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<UserRole>('customer');
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);
  const [sweetSearchQuery, setSweetSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSweetDetail, setSelectedSweetDetail] = useState<MasterSweet | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(() => {
    try {
      return window.localStorage.getItem('sm_city_selected') !== 'true';
    } catch {
      return true;
    }
  });

  const handleCitySelection = (cityId: string) => {
    setActiveCityId(cityId);
    const firstSaleCenter = saleCenters.find((center) => center.cityId === cityId && center.isActive);
    if (firstSaleCenter) {
      setActiveSaleCenterId(firstSaleCenter.id);
      const firstDc = distributionCenters.find((dc) => dc.saleCenterId === firstSaleCenter.id && dc.isActive);
      if (firstDc) {
        setActiveDistributionCenterId(firstDc.id);
        setActiveCenterId(firstDc.id);
      }
    }
    setShowCityPicker(false);
    try {
      window.localStorage.setItem('sm_city_selected', 'true');
    } catch {
      // Continue without persistence when browser storage is unavailable.
    }
  };

  // When the sale centre changes, cascade to its first active distribution centre.
  const handleSaleCenterSelection = (saleCenterId: string) => {
    setActiveSaleCenterId(saleCenterId);
    const firstDc = distributionCenters.find((dc) => dc.saleCenterId === saleCenterId && dc.isActive);
    if (firstDc) {
      setActiveDistributionCenterId(firstDc.id);
      setActiveCenterId(firstDc.id);
    }
  };

  // The distribution centre is the actual pickup point recorded on the order.
  const handleDistributionCenterSelection = (distributionCenterId: string) => {
    setActiveDistributionCenterId(distributionCenterId);
    setActiveCenterId(distributionCenterId);
  };

  // Selected variant state per sweet
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
    kesar_rasmalai: '1 kg (एक किलो)'
  });

  // Quantities per sweet
  const [quantities, setQuantities] = useState<{ [sweetId: string]: number }>({});

  // Centers in active city
  const activeCityCenters = saleCenters.filter(
    (c) => c.cityId === (activeCity?.id || activeCityId) && c.isActive
  );
  const primaryCenter = activeCityCenters[0] || (saleCenters && saleCenters[0]);
  const selectedCityCenters = saleCenters.filter((center) => center.cityId === activeCityId && center.isActive);

  // Resolve the effective sale centre for the active city, then its distribution centres.
  const effectiveSaleCenterId = selectedCityCenters.some((c) => c.id === activeSaleCenterId)
    ? activeSaleCenterId
    : selectedCityCenters[0]?.id || '';

  // Sweets are configured per SALE CENTRE now (pricing + availability).
  const centerConfiguredSweets = getSaleCenterSweets(effectiveSaleCenterId).filter((s) => s.isActive);
  const centerSweetIds = new Set(centerConfiguredSweets.map((s) => s.sweetId));

  // Filter master sweets strictly by the selected sale centre's menu.
  const citySweetsList = masterSweets.filter((sweet) => {
    // Must be offered by the active sale centre
    if (!centerSweetIds.has(sweet.id)) return false;

    // Category filter
    if (activeCategory !== 'all' && sweet.category !== activeCategory) {
      return false;
    }

    // Search query filter
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
  const effectiveDistributionCenterId = saleCenterDistributionCenters.some((dc) => dc.id === activeDistributionCenterId)
    ? activeDistributionCenterId
    : saleCenterDistributionCenters[0]?.id || '';

  const getQty = (sweetId: string) => quantities[sweetId] || 1;

  const handleQtyChange = (sweetId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[sweetId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [sweetId]: next };
    });
  };

  const getSelectedVariant = (sweet: MasterSweet) => {
    const selectedLabel = selectedVariantBySweet[sweet.id];
    if (selectedLabel) {
      const found = sweet.variants.find((v) => v.label === selectedLabel);
      if (found) return found;
    }
    return sweet.variants[0];
  };

  const getVariantLabel = (label: string) => language === 'hi'
    ? label
    : label.replace(' (एक किलो)', '').replace(' (आधा किलो)', '');

  const handleSelectVariant = (sweetId: string, variantLabel: string) => {
    setSelectedVariantBySweet((prev) => ({ ...prev, [sweetId]: variantLabel }));
  };

  const handleAddToCart = (sweet: MasterSweet, expressCheckout = false) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    const currentVariant = getSelectedVariant(sweet);
    const qty = getQty(sweet.id);
    const centerConfig = centerConfiguredSweets.find((s) => s.sweetId === sweet.id);
    const pricePerKg = centerConfig ? centerConfig.pricePerKg : sweet.basePrice || 700;

    const unitPrice = currentVariant.price !== undefined
      ? currentVariant.price
      : Math.round(pricePerKg * currentVariant.weightInKg);

    addToCart({
      sweetId: sweet.id,
      sweetNameHi: sweet.nameHi,
      sweetNameEn: sweet.nameEn,
      variantLabel: currentVariant.label,
      variantKg: currentVariant.weightInKg,
      pricePerKg: pricePerKg,
      unitPrice: unitPrice,
      quantity: qty,
      totalAmount: unitPrice * qty,
      imageUrl: sweet.imageUrl
    });

    if (expressCheckout) {
      onStartCustomerFlow();
    } else {
      setAddedItemNotice(`${sweet.nameHi} (${currentVariant.label} × ${qty})`);
      setTimeout(() => setAddedItemNotice(null), 3500);
    }
  };

  const handleStartBookingWithCheck = () => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    onStartCustomerFlow();
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);
  const cartTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 pb-28 sm:pb-16 px-2 sm:px-4">
      {showCityPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {language === 'hi' ? 'अपना शहर चुनें' : 'Choose your city'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'आपके शहर के अनुसार मिठाइयाँ और केंद्र दिखाए जाएंगे।' : 'We will show sweets and pickup centers for your city.'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {cities.filter((city) => city.isActive).map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCitySelection(city.id)}
                  className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    city.id === activeCityId
                      ? 'border-orange-600 bg-orange-50 text-orange-950'
                      : 'border-slate-200 hover:border-orange-400 hover:bg-amber-50 text-slate-800'
                  }`}
                >
                  <span className="font-bold">{language === 'hi' ? city.nameHi : city.nameEn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification when Sweet is added */}
      {addedItemNotice && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-4 left-3 sm:left-auto z-50 bg-slate-950 text-amber-100 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </div>
            <span className="truncate">{addedItemNotice} कार्ट में जोड़ा गया!</span>
          </div>
          <button
            onClick={onStartCustomerFlow}
            className="px-2.5 sm:px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            कार्ट →
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
                  {language === 'hi' ? `${activeCity?.nameHi} मिष्ठान स्टोर` : `${activeCity?.nameEn} Sweet Store`}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10.5px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  {citySweetsList.length} {language === 'hi' ? 'मिष्ठान उपलब्ध' : 'sweets available'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' ? 'अधिकृत केन्द्र:' : 'Authorized center:'} <span className="font-bold text-amber-950">{language === 'hi' ? primaryCenter?.nameHi : primaryCenter?.nameEn}</span>
              </p>
            </div>
          </div>

          {/* City Switch Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>{language === 'hi' ? 'सक्रिय वितरण क्षेत्र:' : 'Active delivery area:'}</span>
            </span>
            <select
              value={activeCityId}
              onChange={(event) => handleCitySelection(event.target.value)}
              aria-label={language === 'hi' ? 'शहर चुनें' : 'Choose city'}
              className="w-full sm:w-auto sm:min-w-[150px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id} disabled={!city.isActive}>
                  {language === 'hi' ? city.nameHi : city.nameEn}
                  {!city.isActive ? (language === 'hi' ? ' (जल्द उपलब्ध)' : ' (Coming soon)') : ''}
                </option>
              ))}
            </select>
            <select
              value={effectiveSaleCenterId}
              onChange={(event) => handleSaleCenterSelection(event.target.value)}
              aria-label={language === 'hi' ? 'बिक्री केंद्र चुनें' : 'Choose sale centre'}
              className="w-full sm:w-auto sm:min-w-[180px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {selectedCityCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {language === 'hi' ? center.nameHi : center.nameEn}
                </option>
              ))}
            </select>
            <select
              value={effectiveDistributionCenterId}
              onChange={(event) => handleDistributionCenterSelection(event.target.value)}
              aria-label={language === 'hi' ? 'पिकअप वितरण केंद्र चुनें' : 'Choose pickup distribution centre'}
              className="w-full sm:w-auto sm:min-w-[180px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {saleCenterDistributionCenters.length === 0 ? (
                <option value="" disabled>
                  {language === 'hi' ? 'कोई वितरण केंद्र नहीं' : 'No distribution centre'}
                </option>
              ) : (
                saleCenterDistributionCenters.map((dc) => (
                  <option key={dc.id} value={dc.id}>
                    {language === 'hi' ? dc.nameHi : dc.nameEn}
                  </option>
                ))
              )}
            </select>
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
              { id: 'bengali', label: 'रसगुल्ला / बंगाली' }
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
              placeholder={language === 'hi' ? 'मिठाई या घटक खोजें...' : 'Search sweets or ingredients...'}
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
            {language === 'hi' ? 'चयनित श्रेणी में मिठाई उपलब्ध नहीं है' : 'No sweets available in the selected category'}
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {language === 'hi' ? 'कृपया दूसरी श्रेणी चुनें या शहर बदलें।' : 'Please choose another category or change the city.'}
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSweetSearchQuery('');
            }}
            className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs hover:bg-amber-300"
          >
            {language === 'hi' ? `सभी ${activeCity?.nameHi} मिठाइयाँ देखें` : `View all sweets in ${activeCity?.nameEn}`}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {citySweetsList.map((sweet) => {
            const currentVariant = getSelectedVariant(sweet);
            const currentQty = getQty(sweet.id);
            const centerConfig = centerConfiguredSweets.find((s) => s.sweetId === sweet.id);
            const pricePerKg = centerConfig ? centerConfig.pricePerKg : sweet.basePrice || 700;

            const unitPrice = currentVariant.price !== undefined
              ? currentVariant.price
              : Math.round(pricePerKg * currentVariant.weightInKg);

            const subtotal = unitPrice * currentQty;

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
                      alt={language === 'hi' ? sweet.nameHi : sweet.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Pure Desi Ghee Badge */}
                    <span className="absolute top-2 left-2 bg-emerald-800/95 backdrop-blur-xs text-white text-[9.5px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md border border-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      <span>{language === 'hi' ? '100% गाय का देशी घी' : '100% Pure Cow Ghee'}</span>
                    </span>

                    {/* Shelf Life Badge */}
                    <span className="absolute top-2 right-2 bg-amber-950/90 backdrop-blur-xs text-amber-200 text-[9.5px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md border border-amber-400/40">
                      {sweet.shelfLifeDays} {language === 'hi' ? 'दिन ताज़ा' : 'days fresh'}
                    </span>

                    {/* Quick Info Button */}
                    <button
                      onClick={() => setSelectedSweetDetail(sweet)}
                      className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-lg shadow-md transition-all cursor-pointer touch-manipulation"
                      title={language === 'hi' ? 'घटक व विवरण देखें' : 'View ingredients and details'}
                    >
                      <Info className="w-4 h-4 text-orange-700" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-orange-900 transition-colors">
                        {language === 'hi' ? sweet.nameHi : sweet.nameEn}
                      </h3>
                      <span className="text-[9.5px] sm:text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                        HSN {sweet.hsnCode}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {language === 'hi' ? sweet.descriptionHi : sweet.descriptionEn}
                    </p>

                    {(language === 'hi' ? sweet.ingredientsHi : sweet.ingredientsEn) && (
                      <p className="text-[10.5px] text-amber-950 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/70 font-medium line-clamp-1 sm:line-clamp-none">
                        <b>{language === 'hi' ? 'घटक:' : 'Ingredients:'}</b> {language === 'hi' ? sweet.ingredientsHi : sweet.ingredientsEn}
                      </p>
                    )}
                  </div>
                </div>

                {/* Variants, Stepper & Buy Controls */}
                <div className="p-3.5 sm:p-4 pt-0 border-t border-amber-100 mt-1 space-y-2.5 sm:space-y-3">
                  
                  {/* Variant Selection Buttons (1 kg first, then 500g) */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === 'hi' ? 'वजन / पैकिंग चुनें:' : 'Choose weight / pack:'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {sweet.variants.map((v) => {
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
                      <span className="text-[10px] text-slate-400 font-mono block">{language === 'hi' ? 'कुल मूल्य' : 'Total price'}</span>
                      <span className="font-mono font-black text-base sm:text-lg text-red-700">
                        ₹{subtotal}/-
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => handleQtyChange(sweet.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer active:scale-95 touch-manipulation"
                        title={language === 'hi' ? 'कम करें' : 'Decrease quantity'}
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="font-mono font-extrabold text-xs text-slate-900 px-1.5 min-w-[40px] text-center">
                        {currentQty} {language === 'hi' ? 'पैक' : 'packs'}
                      </span>
                      <button
                        onClick={() => handleQtyChange(sweet.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer active:scale-95 touch-manipulation"
                        title={language === 'hi' ? 'बढ़ाएं' : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Add to Cart & Express Buy */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => handleAddToCart(sweet, false)}
                      className="py-2.5 min-h-[40px] bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-950 border border-amber-300 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3] text-orange-800" />
                      <span>{language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to cart'}</span>
                    </button>

                    <button
                      onClick={() => handleAddToCart(sweet, true)}
                      className="py-2.5 min-h-[40px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:from-orange-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer touch-manipulation"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'तुरंत खरीदें →' : 'Buy now →'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. ACTIVE CITY COLLECTION CENTER CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-amber-300/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-red-800 uppercase">
              <Store className="w-4 h-4 text-red-700" />
              <span>{language === 'hi' ? `${activeCity?.nameHi} — अधिकृत वितरण एवं संग्रह केन्द्र` : `${activeCity?.nameEn} — Authorized Distribution & Pickup Centers`}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {language === 'hi' ? primaryCenter?.nameHi || 'सहकार मिष्ठान वितरण केन्द्र' : primaryCenter?.nameEn || 'Sahakar Sweets Distribution Center'}
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
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-800">{language === 'hi' ? 'केन्द्र का नाम' : 'Center name'}</span>
                  <h4 className="font-black text-sm sm:text-base text-slate-900">{language === 'hi' ? center.nameHi : center.nameEn}</h4>
                </div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300">
                  {center.type === 'standalone' ? 'मुख्य भंडार' : 'सहकार मित्र केंद्र'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0 mt-0.5" />
                  <span>{language === 'hi' ? `${center.addressHi} (पिन कोड: ${center.pincode})` : `${center.addressEn} (PIN: ${center.pincode})`}</span>
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

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onStartMitraFlow}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs cursor-pointer text-center"
            >
              मित्र आवेदन करें
            </button>
            <button
              onClick={() => {
                setLoginDefaultRole('mitra');
                setIsLoginModalOpen(true);
              }}
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

          <button
            onClick={() => {
              if (currentUser?.role === 'kendra' || currentUser?.role === 'super_admin' || currentUser?.role === 'city_admin') {
                setRole('kendra');
              } else {
                setLoginDefaultRole('kendra');
                setIsLoginModalOpen(true);
              }
            }}
            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs cursor-pointer text-center"
          >
            केंद्र लॉगिन पोर्टल →
          </button>
        </div>
      </div>

      {/* 6. FLOATING STICKY CART BAR (When cart has items) */}
      {cartTotalItemsCount > 0 && (
        <div className="fixed bottom-20 sm:bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 sm:w-11/12 max-w-2xl bg-amber-950 text-white p-2.5 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between gap-2.5 sm:gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-mono font-black text-xs sm:text-sm shadow shrink-0">
              {cartTotalItemsCount}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold block truncate">
                {cartTotalItemsCount} मिष्ठान पैक चयनित
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-white truncate">
                कुल: ₹{cartTotalAmount}/-
              </span>
            </div>
          </div>

          <button
            onClick={onStartCustomerFlow}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0 touch-manipulation"
          >
            <span>चेकआउट</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* Sweet Detail Modal */}
      {selectedSweetDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border-2 border-amber-400 animate-in zoom-in-95 duration-200">
            <div className="relative h-48 w-full rounded-2xl overflow-hidden">
              <CachedImage
                src={selectedSweetDetail.imageUrl}
                alt={language === 'hi' ? selectedSweetDetail.nameHi : selectedSweetDetail.nameEn}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ● 100% गाय का देशी घी
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{language === 'hi' ? selectedSweetDetail.nameHi : selectedSweetDetail.nameEn}</h3>
              <p className="text-xs text-slate-600 mt-1">{language === 'hi' ? selectedSweetDetail.descriptionHi : selectedSweetDetail.descriptionEn}</p>
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

      {/* Shared Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultRole={loginDefaultRole}
      />
    </div>
  );
};

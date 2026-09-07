/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { preloadImages } from '../utils/imageCache';
import {
  UserRole,
  UserSession,
  Language,
  PickupMode,
  City,
  Festival,
  MasterSweet,
  SaleCenter,
  MitraApplication,
  Booking,
  CartItem,
  AuditLog,
  NotificationTemplate,
  PaymentMethod,
  CustomerInfo,
  DiscountCoupon
} from '../types';
import {
  INITIAL_FESTIVALS,
  INITIAL_MASTER_SWEETS,
  INITIAL_CITIES,
  INITIAL_SALE_CENTERS,
  INITIAL_MITRAS,
  INITIAL_BOOKINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_DISCOUNTS
} from '../data/initialData';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserSession | null;
  loginUser: (session: UserSession) => void;
  updateUserSession: (updated: Partial<UserSession>) => void;
  logoutUser: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  
  // Cutoff force switch for testing
  forceCutoffClosed: boolean;
  setForceCutoffClosed: (closed: boolean) => void;
  isBookingWindowOpen: boolean;

  // Selected state
  activeCityId: string;
  setActiveCityId: (cityId: string) => void;
  activeCity: City;
  cities: City[];
  
  festivals: Festival[];
  activeFestival: Festival;
  
  masterSweets: MasterSweet[];
  saleCenters: SaleCenter[];
  activeCenterId: string;
  setActiveCenterId: (centerId: string) => void;
  
  mitras: MitraApplication[];
  bookings: Booking[];
  auditLogs: AuditLog[];
  notificationTemplates: NotificationTemplate[];

  // Discounts & Coupons
  discounts: DiscountCoupon[];
  createDiscount: (discount: Omit<DiscountCoupon, 'id' | 'createdAt' | 'timesUsed'>) => Promise<DiscountCoupon>;
  updateDiscount: (id: string, updates: Partial<DiscountCoupon>) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;
  validateCoupon: (
    code: string,
    subtotal: number,
    cityId?: string,
    centerId?: string
  ) => {
    valid: boolean;
    discountAmount: number;
    message: string;
    coupon?: DiscountCoupon;
  };

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartQty: (sweetId: string, variantLabel: string, qty: number) => void;
  removeFromCart: (sweetId: string, variantLabel: string) => void;
  clearCart: () => void;

  // Actions
  submitMitraApplication: (app: Omit<MitraApplication, 'id' | 'status' | 'createdAt' | 'creditLimit'>) => Promise<string>;
  approveMitraApplication: (appId: string) => Promise<void>;
  rejectMitraApplication: (appId: string, reason: string) => Promise<void>;
  createSaleCenter: (center: Omit<SaleCenter, 'id'>) => Promise<string>;
  updateCitySweetPrice: (cityId: string, sweetId: string, price: number, isActive: boolean) => Promise<void>;
  addMasterSweet: (sweet: MasterSweet) => Promise<void>;
  updateMasterSweet: (sweet: MasterSweet) => Promise<void>;
  addCity: (city: City) => Promise<void>;
  updateCity: (city: City) => Promise<void>;
  deleteCity: (cityId: string) => Promise<void>;
  addFestival: (festival: Festival) => Promise<void>;
  updateFestival: (id: string, updatedFields: Partial<Festival>) => Promise<void>;
  updateFestivalStatus: (id: string, status: 'active' | 'draft' | 'completed') => Promise<void>;

  // Booking Flow
  createBooking: (
    bookedByRole: 'customer' | 'mitra',
    customer: CustomerInfo,
    centerId: string,
    pickupDate: string,
    paymentMethod: PaymentMethod,
    mitraId?: string,
    mitraName?: string,
    zohoDetails?: {
      zohoPaymentId?: string;
      zohoPaymentSessionId?: string;
      zohoOrderId?: string;
      zohoPaymentMode?: string;
      invoiceId?: string;
    },
    discountDetails?: {
      discountCode?: string;
      discountAmount?: number;
      subtotalAmount?: number;
    },
    pickupDetails?: {
      pickupMode: PickupMode;
      pickupMitraId?: string;
      pickupMitraName?: string;
    }
  ) => Promise<Booking>;
  
  deliverBooking: (bookingId: string, otpGiven: string, paymentCollectedMethod?: 'cash' | 'upi') => Promise<{ success: boolean; message: string }>;
  settleMitraDues: (
    mitraId: string,
    zohoDetails: {
      zohoPaymentId: string;
      invoiceId: string;
      paymentMode: string;
      amount: number;
    }
  ) => Promise<void>;
  
  // OTP Modal
  otpModalState: { isOpen: boolean; phone: string; title?: string; onVerify?: (code: string) => boolean };
  openOtpModal: (phone: string, title?: string, onVerify?: (code: string) => boolean) => void;
  closeOtpModal: () => void;

  // Reset
  resetAllData: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Safe localStorage wrappers to handle iframe sandboxing and storage exceptions
const safeStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage access warning:', e);
    }
    return null;
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage write warning:', e);
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage remove warning:', e);
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('common');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = safeStorage.get('sm_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to parse current user session:', e);
      return null;
    }
  });
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeStorage.get('sm_language');
    return saved === 'en' || saved === 'hi' ? saved : 'hi';
  });
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeStorage.set('sm_language', lang);
  };
  const [forceCutoffClosed, setForceCutoffClosed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loginUser = (session: UserSession) => {
    setCurrentUser(session);
    setRole(session.role);
    safeStorage.set('sm_current_user', JSON.stringify(session));
    logAction(`${session.name} (${session.role})`, `सफल लॉगिन संपन्न`);
  };

  const updateUserSession = (updated: Partial<UserSession>) => {
    if (!currentUser) return;
    const newSession = { ...currentUser, ...updated };
    setCurrentUser(newSession);
    safeStorage.set('sm_current_user', JSON.stringify(newSession));
    logAction(`${newSession.name} (${newSession.role})`, `प्रोफ़ाइल विवरण अपडेट किया गया`);
  };

  const logoutUser = () => {
    if (currentUser) {
      logAction(`${currentUser.name} (${currentUser.role})`, `लॉगआउट किया`);
    }
    setCurrentUser(null);
    setRole('common');
    safeStorage.remove('sm_current_user');
  };

  const [activeCityId, setActiveCityIdState] = useState<string>(() => {
    const saved = safeStorage.get('sm_active_city_id');
    return saved || 'sawai_madhopur';
  });
  const [activeCenterId, setActiveCenterId] = useState<string>('kendra_aastha_sawaimadhopur');

  const setActiveCityId = (cityId: string) => {
    setActiveCityIdState(cityId);
    safeStorage.set('sm_active_city_id', cityId);
  };

  const [festivals, setFestivals] = useState<Festival[]>(INITIAL_FESTIVALS);
  const [masterSweets, setMasterSweets] = useState<MasterSweet[]>(INITIAL_MASTER_SWEETS);
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES);
  const [saleCenters, setSaleCenters] = useState<SaleCenter[]>(INITIAL_SALE_CENTERS);
  const [mitras, setMitras] = useState<MitraApplication[]>(INITIAL_MITRAS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>(INITIAL_NOTIFICATION_TEMPLATES);
  const [discounts, setDiscounts] = useState<DiscountCoupon[]>(INITIAL_DISCOUNTS);

  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const selectedCity = cities.find((city) => city.id === activeCityId);
    if (selectedCity && !selectedCity.isActive) {
      const availableCity = cities.find((city) => city.isActive);
      if (availableCity) setActiveCityId(availableCity.id);
    }
  }, [cities, activeCityId]);

  // OTP Modal State
  const [otpModalState, setOtpModalState] = useState<{
    isOpen: boolean;
    phone: string;
    title?: string;
    onVerify?: (code: string) => boolean;
  }>({
    isOpen: false,
    phone: ''
  });

  // Load All Data from Cloud SQL Postgres via API
  const loadDataFromDb = async () => {
    try {
      setIsLoading(true);
      const [
        sweetsRes,
        citiesRes,
        centersRes,
        festivalsRes,
        mitrasRes,
        bookingsRes,
        logsRes,
        notifsRes,
        discountsRes
      ] = await Promise.all([
        fetch('/api/master-sweets'),
        fetch('/api/cities'),
        fetch('/api/sale-centers'),
        fetch('/api/festivals'),
        fetch('/api/mitra-applications'),
        fetch('/api/bookings'),
        fetch('/api/audit-logs'),
        fetch('/api/notification-templates'),
        fetch('/api/discounts')
      ]);

      if (sweetsRes.ok) {
        const data = await sweetsRes.json();
        if (data && data.length > 0) setMasterSweets(data);
      }
      if (citiesRes.ok) {
        const data = await citiesRes.json();
        if (data && data.length > 0) setCities(data);
      }
      if (centersRes.ok) {
        const data = await centersRes.json();
        if (data && data.length > 0) setSaleCenters(data);
      }
      if (festivalsRes.ok) {
        const data = await festivalsRes.json();
        if (data && data.length > 0) setFestivals(data);
      }
      if (mitrasRes.ok) {
        const data = await mitrasRes.json();
        if (data && data.length > 0) setMitras(data);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        if (data && data.length > 0) setBookings(data);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        if (data && data.length > 0) setAuditLogs(data);
      }
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        if (data && data.length > 0) setNotificationTemplates(data);
      }
      if (discountsRes.ok) {
        const data = await discountsRes.json();
        if (data && data.length > 0) setDiscounts(data);
      }
    } catch (err) {
      console.error('Failed to load data from Cloud SQL DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromDb();
  }, []);

  // Image Caching & Preloading Effect
  useEffect(() => {
    const urlsToPreload: string[] = [
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/rakhi_banner_hero_1785743232867.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/besan_ladoo_1785741256634.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/gulab_jamun_1785741287674.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/kesar_ghevar_1785741274079.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/kesar_rasmalai_dmb_1785830333876.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/milk_cake_dmb_1785830317278.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/mix_dry_fruits_1785741241492.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/motichoor_ladoo_dmb_1785830283483.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/kaju_katli_dmb_1785830397687.jpg',
      'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/sweets/rasgulla_dmb_1785830458412.jpg'
    ];

    masterSweets.forEach((s) => {
      if (s.imageUrl) urlsToPreload.push(s.imageUrl);
      if (s.images && s.images.length > 0) {
        s.images.forEach((img) => urlsToPreload.push(img));
      }
    });

    festivals.forEach((f) => {
      if ((f as any).bannerImageUrl) urlsToPreload.push((f as any).bannerImageUrl);
    });

    preloadImages(urlsToPreload);
  }, [masterSweets, festivals]);

  const activeCity = cities.find((c) => c.id === activeCityId) || cities[0];
  const activeFestival = festivals.find((f) => f.status === 'active') || festivals[0];

  // Booking window logic
  const today = new Date().toISOString().split('T')[0];
  const isDatePastCutoff = activeFestival ? today > activeFestival.cutoffDate : false;
  const isBookingWindowOpen = !forceCutoffClosed && !isDatePastCutoff;

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.sweetId === newItem.sweetId && i.variantLabel === newItem.variantLabel
      );
      if (idx > -1) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + newItem.quantity;
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          totalAmount: newQty * updated[idx].unitPrice
        };
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const updateCartQty = (sweetId: string, variantLabel: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(sweetId, variantLabel);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.sweetId === sweetId && item.variantLabel === variantLabel) {
          return {
            ...item,
            quantity: qty,
            totalAmount: qty * item.unitPrice
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (sweetId: string, variantLabel: string) => {
    setCart((prev) => prev.filter((i) => !(i.sweetId === sweetId && i.variantLabel === variantLabel)));
  };

  const clearCart = () => setCart([]);

  const logAction = async (actor: string, actionHi: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actor,
      actionHi,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    const postLog = async (retries = 2): Promise<void> => {
      try {
        const res = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        });
        if (!res.ok && retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return postLog(retries - 1);
        }
      } catch (e) {
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return postLog(retries - 1);
        }
        console.warn('Could not sync audit log to server:', e);
      }
    };

    postLog();
  };

  const submitMitraApplication = async (appData: Omit<MitraApplication, 'id' | 'status' | 'createdAt' | 'creditLimit'>) => {
    const id = `SM-${appData.cityId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempPassword = `Pass#${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: MitraApplication = {
      ...appData,
      id,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      tempPassword,
      creditLimit: 25000
    };
    setMitras((prev) => [newApp, ...prev]);
    try {
      await fetch('/api/mitra-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });
    } catch (e) {
      console.error('Error submitting mitra application to DB:', e);
    }
    logAction('सहकार मित्र (आवेदक)', `नया सहकार मित्र आवेदन ${id} (${appData.fullName}) प्राप्त हुआ`);
    return id;
  };

  const approveMitraApplication = async (appId: string) => {
    const appToUpdate = mitras.find((m) => m.id === appId);
    if (!appToUpdate) return;

    let updatedApp: MitraApplication = { ...appToUpdate, status: 'approved' };
    setMitras((prev) => prev.map((m) => (m.id === appId ? updatedApp : m)));

    if (appToUpdate.agreedToCenter) {
      const centerId = `kendra_mitra_${appToUpdate.id.toLowerCase()}`;
      const newCenter: SaleCenter = {
        id: centerId,
        cityId: appToUpdate.cityId,
        nameHi: `${appToUpdate.fullName} सहकार मित्र केंद्र`,
        nameEn: `${appToUpdate.fullName} Mitra Kendra`,
        type: 'mitra_kendra',
        ownerName: `${appToUpdate.fullName} (सहकार मित्र)`,
        ownerPhone: appToUpdate.phone,
        ownerEmail: appToUpdate.email,
        addressHi: appToUpdate.address,
        addressEn: appToUpdate.address,
        pincode: appToUpdate.pincode,
        timing: '09:00 AM - 08:00 PM',
        isActive: true
      };
      setSaleCenters((cList) => [...cList, newCenter]);
      try {
        await fetch('/api/sale-centers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCenter)
        });
      } catch (e) {
        console.error('Error creating sale center in DB:', e);
      }
    }

    try {
      await fetch(`/api/mitra-applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedApp)
      });
    } catch (e) {
      console.error('Error approving mitra application in DB:', e);
    }
    logAction('शहर एडमिन', `सहकार मित्र आवेदन ${appId} स्वीकृत किया`);
  };

  const rejectMitraApplication = async (appId: string, reason: string) => {
    const appToUpdate = mitras.find((m) => m.id === appId);
    if (!appToUpdate) return;

    const updatedApp: MitraApplication = { ...appToUpdate, status: 'rejected', rejectionReason: reason };
    setMitras((prev) => prev.map((m) => (m.id === appId ? updatedApp : m)));

    try {
      await fetch(`/api/mitra-applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedApp)
      });
    } catch (e) {
      console.error('Error rejecting mitra application in DB:', e);
    }
    logAction('शहर एडमिन', `सहकार मित्र आवेदन ${appId} अस्वीकृत किया। कारण: ${reason}`);
  };

  const createSaleCenter = async (centerData: Omit<SaleCenter, 'id'>) => {
    const id = `kendra_${Date.now()}`;
    const newCenter: SaleCenter = { ...centerData, id };
    setSaleCenters((prev) => [...prev, newCenter]);
    try {
      await fetch('/api/sale-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCenter)
      });
    } catch (e) {
      console.error('Error creating sale center in DB:', e);
    }
    logAction('शहर एडमिन', `नया बिक्री केंद्र ${centerData.nameHi} जोड़ा गया`);
    return id;
  };

  const updateCitySweetPrice = async (cityId: string, sweetId: string, price: number, isActive: boolean) => {
    let updatedCityObj: City | null = null;
    setCities((prev) =>
      prev.map((c) => {
        if (c.id === cityId) {
          const sweetIdx = c.sweets.findIndex((s) => s.sweetId === sweetId);
          let updatedSweets = [...c.sweets];
          if (sweetIdx > -1) {
            updatedSweets[sweetIdx] = { sweetId, pricePerKg: price, isActive };
          } else {
            updatedSweets.push({ sweetId, pricePerKg: price, isActive });
          }
          updatedCityObj = { ...c, sweets: updatedSweets };
          return updatedCityObj;
        }
        return c;
      })
    );

    if (updatedCityObj) {
      try {
        await fetch(`/api/cities/${cityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCityObj)
        });
      } catch (e) {
        console.error('Error updating city sweet price in DB:', e);
      }
    }
    logAction('शहर एडमिन', `शहर ${cityId} में मिठाई ${sweetId} का मूल्य ₹${price} निर्धारित किया`);
  };

  const addMasterSweet = async (sweet: MasterSweet) => {
    setMasterSweets((prev) => [...prev, sweet]);
    try {
      await fetch('/api/master-sweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sweet)
      });
    } catch (e) {
      console.error('Error adding master sweet to DB:', e);
    }

    const defaultPrice = sweet.basePrice || 600;
    setCities((prevCities) =>
      prevCities.map((city) => {
        const exists = city.sweets.some((s) => s.sweetId === sweet.id);
        if (exists) return city;
        const updatedCity = {
          ...city,
          sweets: [...city.sweets, { sweetId: sweet.id, pricePerKg: defaultPrice, isActive: true }]
        };
        fetch(`/api/cities/${city.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCity)
        }).catch((e) => console.error('Error updating city in DB:', e));
        return updatedCity;
      })
    );

    logAction('प्रशासक', `मास्टर कैटलॉग में नई मिठाई ${sweet.nameHi} जोड़ी गई`);
  };

  const updateMasterSweet = async (sweet: MasterSweet) => {
    setMasterSweets((prev) => prev.map((s) => (s.id === sweet.id ? sweet : s)));
    try {
      await fetch(`/api/master-sweets/${sweet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sweet)
      });
    } catch (e) {
      console.error('Error updating master sweet in DB:', e);
    }
    logAction('सुपर एडमिन', `मास्टर कैटलॉग में मिठाई ${sweet.nameHi} को अद्यतन (Edit) किया गया`);
  };

  const addCity = async (newCity: City) => {
    setCities((prev) => [...prev, newCity]);
    try {
      await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCity)
      });
    } catch (e) {
      console.error('Error adding city to DB:', e);
    }
    logAction('सुपर एडमिन', `नया शहर ${newCity.nameHi} जोड़ा गया`);
  };

  const updateCity = async (updatedCity: City) => {
    setCities((prev) => prev.map((city) => city.id === updatedCity.id ? updatedCity : city));
    try {
      await fetch(`/api/cities/${updatedCity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCity)
      });
    } catch (e) {
      console.error('Error updating city in DB:', e);
    }
    logAction('सुपर एडमिन', `शहर ${updatedCity.nameHi} का विवरण अद्यतन किया गया`);
  };

  const deleteCity = async (cityId: string) => {
    const city = cities.find((item) => item.id === cityId);
    const remainingCities = cities.filter((item) => item.id !== cityId);
    setCities(remainingCities);
    if (activeCityId === cityId) {
      const fallbackCity = remainingCities.find((item) => item.isActive) || remainingCities[0];
      if (fallbackCity) setActiveCityId(fallbackCity.id);
    }
    try {
      await fetch(`/api/cities/${cityId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting city from DB:', e);
    }
    logAction('सुपर एडमिन', `शहर ${city?.nameHi || cityId} हटाया गया`);
  };

  const addFestival = async (newFest: Festival) => {
    setFestivals((prev) => [...prev, newFest]);
    try {
      await fetch('/api/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFest)
      });
    } catch (e) {
      console.error('Error adding festival to DB:', e);
    }
    logAction('सुपर एडमिन', `नया त्योहार ${newFest.nameHi} जोड़ा गया`);
  };

  const updateFestival = async (id: string, updatedFields: Partial<Festival>) => {
    let updatedFest: Festival | null = null;
    setFestivals((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          updatedFest = { ...f, ...updatedFields };
          return updatedFest;
        }
        return f;
      })
    );

    if (updatedFest) {
      try {
        await fetch(`/api/festivals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFest)
        });
      } catch (e) {
        console.error('Error updating festival in DB:', e);
      }
    }
    logAction('सुपर एडमिन', `त्योहार ${id} का विवरण/विंडो तिथियां अद्यतन (Edit) की गईं`);
  };

  const updateFestivalStatus = async (id: string, status: 'active' | 'draft' | 'completed') => {
    setFestivals((prev) => {
      const updatedList = prev.map((f) => {
        if (f.id === id) return { ...f, status };
        if (status === 'active' && f.status === 'active') return { ...f, status: 'completed' as const };
        return f;
      });

      updatedList.forEach((f) => {
        fetch(`/api/festivals/${f.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(f)
        }).catch((e) => console.error('Error updating festival status in DB:', e));
      });

      return updatedList;
    });
    logAction('सुपर एडमिन', `त्योहार ${id} की स्थिति ${status} की गई`);
  };

  // Discount Actions
  const createDiscount = async (newDiscount: Omit<DiscountCoupon, 'id' | 'createdAt' | 'timesUsed'>): Promise<DiscountCoupon> => {
    const id = `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const coupon: DiscountCoupon = {
      ...newDiscount,
      id,
      code: newDiscount.code.trim().toUpperCase(),
      timesUsed: 0,
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    setDiscounts((prev) => [coupon, ...prev]);

    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupon),
      });
      if (res.ok) {
        const saved = await res.json();
        setDiscounts((prev) => prev.map((d) => (d.id === id ? saved : d)));
        logAction('सिटी सेंटर एडमिन', `नया डिस्काउंट कूपन बनाया: ${coupon.code} (${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '₹' + coupon.discountValue})`);
        return saved;
      }
    } catch (e) {
      console.error('Failed to save discount to DB:', e);
    }
    logAction('सिटी सेंटर एडमिन', `नया डिस्काउंट कूपन बनाया: ${coupon.code}`);
    return coupon;
  };

  const updateDiscount = async (id: string, updates: Partial<DiscountCoupon>): Promise<void> => {
    setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    try {
      await fetch(`/api/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      logAction('सिटी सेंटर एडमिन', `डिस्काउंट कूपन अद्यतन किया गया: ID ${id}`);
    } catch (e) {
      console.error('Failed to update discount:', e);
    }
  };

  const deleteDiscount = async (id: string): Promise<void> => {
    const target = discounts.find((d) => d.id === id);
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
      });
      logAction('सिटी सेंटर एडमिन', `डिस्काउंट कूपन हटाया गया: ${target?.code || id}`);
    } catch (e) {
      console.error('Failed to delete discount:', e);
    }
  };

  const validateCoupon = (
    code: string,
    subtotal: number,
    cityId?: string,
    centerId?: string
  ) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, discountAmount: 0, message: 'कृपया कूपन कोड दर्ज करें (Please enter coupon code)' };
    }
    const coupon = discounts.find((d) => d.code.toUpperCase() === cleanCode);
    if (!coupon) {
      return { valid: false, discountAmount: 0, message: 'अमान्य कूपन कोड (Invalid coupon code)' };
    }
    if (!coupon.isActive) {
      return { valid: false, discountAmount: 0, message: 'यह कूपन अब सक्रिय नहीं है (Coupon is inactive)' };
    }
    if (coupon.cityId !== 'all' && cityId && coupon.cityId !== cityId) {
      return { valid: false, discountAmount: 0, message: 'यह कूपन आपके चयनित शहर के लिए लागू नहीं है' };
    }
    if (coupon.centerId && coupon.centerId !== 'all' && centerId && coupon.centerId !== centerId) {
      return { valid: false, discountAmount: 0, message: 'यह कूपन आपके चयनित केंद्र के लिए लागू नहीं है' };
    }
    if (coupon.expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (today > coupon.expiryDate) {
        return { valid: false, discountAmount: 0, message: 'यह कूपन समाप्त (Expire) हो चुका है' };
      }
    }
    if (coupon.usageLimit && (coupon.timesUsed || 0) >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'इस कूपन की उपयोग सीमा समाप्त हो चुकी है (Usage limit reached)' };
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `यह कूपन न्यूनतम ₹${coupon.minOrderAmount} के ऑर्डर पर लागू होगा (Min order ₹${coupon.minOrderAmount})`
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      valid: true,
      discountAmount,
      message: `🎉 '${coupon.code}' लागू हुआ! ₹${discountAmount} की छूट प्राप्त हुई।`,
      coupon
    };
  };

  const createBooking = async (
    bookedByRole: 'customer' | 'mitra',
    customer: CustomerInfo,
    centerId: string,
    pickupDate: string,
    paymentMethod: PaymentMethod,
    mitraId?: string,
    mitraName?: string,
    zohoDetails?: {
      zohoPaymentId?: string;
      zohoPaymentSessionId?: string;
      zohoOrderId?: string;
      zohoPaymentMode?: string;
      invoiceId?: string;
    },
    discountDetails?: {
      discountCode?: string;
      discountAmount?: number;
      subtotalAmount?: number;
    },
    pickupDetails?: {
      pickupMode: PickupMode;
      pickupMitraId?: string;
      pickupMitraName?: string;
    }
  ): Promise<Booking> => {
    const center =
      saleCenters.find((c) => c.id === centerId) ||
      saleCenters.find((c) => c.cityId === activeCity?.id) ||
      saleCenters[0] || {
        id: centerId || 'center_default',
        nameHi: 'मुख्य वितरण केंद्र (सहकार केंद्र)',
        addressHi: activeCity?.nameHi ? `${activeCity.nameHi}, राजस्थान` : 'जयपुर, राजस्थान',
        ownerPhone: '9829012345'
      };

    const totalKg = cart.reduce((acc, i) => acc + (i.variantKg || 0) * (i.quantity || 0), 0);
    const cartSubtotal = cart.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const subtotalAmount = discountDetails?.subtotalAmount ?? cartSubtotal;
    const discountAmount = discountDetails?.discountAmount ?? 0;
    const discountCode = discountDetails?.discountCode;
    const finalTotalAmount = Math.max(0, subtotalAmount - discountAmount);

    const bookingNum = Math.floor(1000 + Math.random() * 9000);
    const id = `#PB-${bookingNum}`;

    const newBooking: Booking = {
      id,
      festivalId: activeFestival ? activeFestival.id : 'diwali_2026',
      festivalNameHi: activeFestival ? activeFestival.nameHi : 'दीपावली 2026',
      festivalNameEn: activeFestival ? activeFestival.nameEn : 'Diwali 2026',
      cityId: activeCity ? activeCity.id : 'jaipur',
      cityNameHi: activeCity ? activeCity.nameHi : 'जयपुर',
      cityNameEn: activeCity ? activeCity.nameEn : 'Jaipur',
      centerId: center.id,
      centerNameHi: center.nameHi || 'सहकार केंद्र',
      centerNameEn: center.nameEn || 'Sahakar Center',
      centerAddressHi: center.addressHi || 'जयपुर, राजस्थान',
      centerAddressEn: center.addressEn || 'Jaipur, Rajasthan',
      centerPhone: center.ownerPhone || '9829012345',
      bookedByRole,
      mitraId,
      mitraName,
      pickupMode: pickupDetails?.pickupMode || 'self',
      pickupMitraId: pickupDetails?.pickupMitraId,
      pickupMitraName: pickupDetails?.pickupMitraName,
      customer: {
        name: customer?.name || 'ग्राहक',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        pincode: customer?.pincode || ''
      },
      items: [...cart],
      totalKg,
      totalAmount: finalTotalAmount,
      subtotalAmount: subtotalAmount,
      discountCode: discountCode || undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'udhar_outstanding',
      status: 'confirmed',
      pickupDate: pickupDate || activeFestival?.distributionStartDate || '15-10-2026',
      deliveryOtp: String(bookingNum),
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      invoiceId: zohoDetails?.invoiceId,
      zohoPaymentId: zohoDetails?.zohoPaymentId,
      zohoPaymentSessionId: zohoDetails?.zohoPaymentSessionId,
      zohoOrderId: zohoDetails?.zohoOrderId,
      zohoPaymentMode: zohoDetails?.zohoPaymentMode
    };

    setBookings((prev) => [newBooking, ...prev]);
    clearCart();

    // Increment coupon usage if discount applied
    if (discountCode) {
      const usedCoupon = discounts.find((d) => d.code.toUpperCase() === discountCode.toUpperCase());
      if (usedCoupon) {
        setDiscounts((prev) =>
          prev.map((d) => (d.id === usedCoupon.id ? { ...d, timesUsed: (d.timesUsed || 0) + 1 } : d))
        );
        fetch(`/api/discounts/${usedCoupon.id}/use`, { method: 'POST' }).catch((e) =>
          console.error('Failed to increment coupon usage:', e)
        );
      }
    }

    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
    } catch (e) {
      console.error('Error saving booking to DB:', e);
    }

    const discountNote = discountAmount > 0 ? ` [छूट कूपन: ${discountCode}, ₹${discountAmount} छूट, मूल राशि: ₹${subtotalAmount}]` : '';
    const paymentNote = zohoDetails?.zohoPaymentId
      ? ` (Zoho Payments ID: ${zohoDetails.zohoPaymentId})`
      : '';

    logAction(
      bookedByRole === 'mitra' ? `सहकार मित्र (${mitraName})` : `ग्राहक (${customer?.name || 'ग्राहक'})`,
      `नई प्री-बुकिंग ${id} (${totalKg} kg, ₹${finalTotalAmount}) दर्ज की गई${discountNote}${paymentNote}`
    );

    return newBooking;
  };

  const deliverBooking = async (bookingId: string, otpGiven: string, paymentCollectedMethod?: 'cash' | 'upi') => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, message: 'ऑर्डर नहीं मिला' };
    }
    if (booking.deliveryOtp !== otpGiven.trim()) {
      return { success: false, message: 'गलत OTP दर्ज किया गया' };
    }

    const invoiceNum = `INV-${booking.cityNameHi.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const updatedBooking: Booking = {
      ...booking,
      status: 'delivered',
      paymentStatus: 'paid',
      deliveredAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      invoiceId: invoiceNum
    };

    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));

    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBooking)
      });
    } catch (e) {
      console.error('Error delivering booking in DB:', e);
    }

    logAction('बिक्री केंद्र', `ऑर्डर ${bookingId} का सफल OTP सत्यापन। डिलीवरी पूर्ण एवं इनवॉइस ${invoiceNum} जारी।`);
    return { success: true, message: 'डिलीवरी सफल!' };
  };

  const settleMitraDues = async (
    mitraId: string,
    zohoDetails: {
      zohoPaymentId: string;
      invoiceId: string;
      paymentMode: string;
      amount: number;
    }
  ) => {
    const updatedBookings = bookings.map((b) => {
      if (b.mitraId === mitraId && b.paymentStatus === 'udhar_outstanding') {
        return {
          ...b,
          paymentStatus: 'paid' as const,
          zohoPaymentId: zohoDetails.zohoPaymentId,
          zohoPaymentMode: zohoDetails.paymentMode
        };
      }
      return b;
    });

    setBookings(updatedBookings);

    // Persist each settled booking
    const affected = bookings.filter((b) => b.mitraId === mitraId && b.paymentStatus === 'udhar_outstanding');
    for (const item of affected) {
      try {
        await fetch(`/api/bookings/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            paymentStatus: 'paid',
            zohoPaymentId: zohoDetails.zohoPaymentId,
            zohoPaymentMode: zohoDetails.paymentMode
          })
        });
      } catch (e) {
        console.error('Error updating booking due status:', e);
      }
    }

    logAction('सहकार मित्र', `Zoho Payments द्वारा ₹${zohoDetails.amount} का बकाया भुगतान पूर्ण (ID: ${zohoDetails.zohoPaymentId})`);
  };

  const openOtpModal = (phone: string, title?: string, onVerify?: (code: string) => boolean) => {
    setOtpModalState({ isOpen: true, phone, title, onVerify });
  };

  const closeOtpModal = () => {
    setOtpModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const resetAllData = async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      await loadDataFromDb();
      setCart([]);
      setForceCutoffClosed(false);
      setActiveCityId('sawai_madhopur');
      setActiveCenterId('kendra_aastha_sawaimadhopur');
    } catch (e) {
      console.error('Error resetting DB data:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        loginUser,
        updateUserSession,
        logoutUser,
        language,
        setLanguage,
        toggleLanguage,
        forceCutoffClosed,
        setForceCutoffClosed,
        isBookingWindowOpen,
        activeCityId,
        setActiveCityId,
        activeCity,
        cities,
        festivals,
        activeFestival,
        masterSweets,
        saleCenters,
        activeCenterId,
        setActiveCenterId,
        mitras,
        bookings,
        auditLogs,
        notificationTemplates,
        discounts,
        createDiscount,
        updateDiscount,
        deleteDiscount,
        validateCoupon,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        submitMitraApplication,
        approveMitraApplication,
        rejectMitraApplication,
        createSaleCenter,
        updateCitySweetPrice,
        addMasterSweet,
        updateMasterSweet,
        addCity,
        updateCity,
        deleteCity,
        addFestival,
        updateFestival,
        updateFestivalStatus,
        createBooking,
        deliverBooking,
        settleMitraDues,
        otpModalState,
        openOtpModal,
        closeOtpModal,
        resetAllData,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

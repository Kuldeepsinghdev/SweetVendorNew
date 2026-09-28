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
  DistributionCenter,
  SaleCenterSweet,
  MitraApplication,
  Booking,
  CartItem,
  AuditLog,
  NotificationTemplate,
  PaymentMethod,
  CustomerInfo,
  DiscountCoupon,
  User
} from '../types';

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

  // Distribution centres (children of sale centres; the pickup point picked at checkout)
  distributionCenters: DistributionCenter[];
  activeSaleCenterId: string;
  setActiveSaleCenterId: (saleCenterId: string) => void;
  activeDistributionCenterId: string;
  setActiveDistributionCenterId: (distributionCenterId: string) => void;
  createDistributionCenter: (center: Omit<DistributionCenter, 'id'>) => Promise<string>;
  updateDistributionCenter: (center: DistributionCenter) => Promise<void>;
  deleteDistributionCenter: (id: string) => Promise<void>;

  // Per-sale-centre sweet menu + pricing (replaces city-level pricing).
  saleCenterSweets: SaleCenterSweet[];
  getSaleCenterSweets: (saleCenterId: string) => SaleCenterSweet[];

  mitras: MitraApplication[];
  bookings: Booking[];
  auditLogs: AuditLog[];
  notificationTemplates: NotificationTemplate[];

  // Users (dedicated users table)
  users: User[];
  resolveOrCreateUser: (input: { name?: string; phone: string; email?: string; role?: User['role']; cityId?: string; pincode?: string; address?: string }) => Promise<User | null>;

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
  updateSaleCenter: (center: SaleCenter) => Promise<void>;
  updateSaleCenterSweetPrice: (saleCenterId: string, sweetId: string, price: number, isActive: boolean) => Promise<void>;
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

    // Bind the active city/center to the user's assigned scope so scoped roles
    // (city_admin, kendra, mitra) land on their own data instead of the default.
    if (session.cityId) {
      setActiveCityId(session.cityId);
    }
    if (session.centerId) {
      setActiveCenterId(session.centerId);
    }

    // Re-fetch bookings scoped to this session so a city_admin/kendra only pulls
    // their own city/center data from the server (not just filtered client-side).
    if (
      (session.role === 'city_admin' && session.cityId) ||
      (session.role === 'kendra' && session.centerId)
    ) {
      loadDataFromDb(session);
    }

    // Resolve (or create) the backing users-table row and attach userId to the
    // session. Non-blocking and resilient if the endpoint isn't live yet.
    if (session.role !== 'common' && session.role !== 'profile' && session.phone) {
      (async () => {
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: session.name,
              phone: session.phone,
              role: session.role,
            }),
          });
          if (res.ok) {
            const user = await res.json();
            setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [user, ...prev]));
            setCurrentUser((prev) => {
              if (!prev) return prev;
              const merged = { ...prev, userId: user.id, id: prev.id || user.id };
              safeStorage.set('sm_current_user', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (e) {
          console.warn('Could not resolve user row at login (pre-migration?):', e);
        }
      })();
    }
  };

  const updateUserSession = (updated: Partial<UserSession>) => {
    if (!currentUser) return;
    const newSession = { ...currentUser, ...updated };
    setCurrentUser(newSession);
    safeStorage.set('sm_current_user', JSON.stringify(newSession));
    logAction(`${newSession.name} (${newSession.role})`, `प्रोफ़ाइल विवरण अपडेट किया गया`);

    // Persist profile edits to the users table when we have a backing row.
    if (newSession.userId) {
      fetch(`/api/users/${newSession.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSession.name, phone: newSession.phone }),
      }).catch((e) => console.warn('Could not persist profile update to users table:', e));
    }
  };

  const logoutUser = () => {
    if (currentUser) {
      logAction(`${currentUser.name} (${currentUser.role})`, `लॉगआउट किया`);
    }
    setCurrentUser(null);
    setRole('common');
    safeStorage.remove('sm_current_user');
    // Reload unscoped data so the guest/next user sees the full dataset again.
    loadDataFromDb(null);
  };

  const [activeCityId, setActiveCityIdState] = useState<string>(() => {
    const saved = safeStorage.get('sm_active_city_id');
    return saved || 'sawai_madhopur';
  });
  const [activeCenterId, setActiveCenterId] = useState<string>('kendra_aastha_sawaimadhopur');
  const [activeSaleCenterId, setActiveSaleCenterId] = useState<string>('kendra_aastha_sawaimadhopur');
  const [activeDistributionCenterId, setActiveDistributionCenterId] = useState<string>('dc_aastha_bajariya');

  const setActiveCityId = (cityId: string) => {
    setActiveCityIdState(cityId);
    safeStorage.set('sm_active_city_id', cityId);
  };

  // Business data is sourced exclusively from the database via loadDataFromDb().
  // State starts empty and is populated by the API response (including empty
  // results). Seed data (INITIAL_*) is only used server-side by src/db/seed.ts.
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [masterSweets, setMasterSweets] = useState<MasterSweet[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [saleCenters, setSaleCenters] = useState<SaleCenter[]>([]);
  const [distributionCenters, setDistributionCenters] = useState<DistributionCenter[]>([]);
  const [saleCenterSweets, setSaleCenterSweets] = useState<SaleCenterSweet[]>([]);
  const [mitras, setMitras] = useState<MitraApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Resolve an existing users row by phone or create one. Returns the row (or
  // null if the endpoint is unavailable). Used by booking/mitra flows to attach
  // FK references instead of denormalized name/phone strings.
  const resolveOrCreateUser: AppContextType['resolveOrCreateUser'] = async (input) => {
    const normPhone = (input.phone || '').replace(/\D/g, '').slice(-10);
    if (normPhone.length !== 10) return null;
    const cached = users.find((u) => (u.phone || '').replace(/\D/g, '').slice(-10) === normPhone);
    if (cached) return cached;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name || 'ग्राहक',
          phone: normPhone,
          email: input.email,
          role: input.role || 'customer',
          cityId: input.cityId,
          pincode: input.pincode,
          address: input.address,
        }),
      });
      if (!res.ok) return null;
      const user: User = await res.json();
      setUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [user, ...prev]));
      return user;
    } catch (e) {
      console.warn('resolveOrCreateUser failed (pre-migration?):', e);
      return null;
    }
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCoupon[]>([]);

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

  // Build the bookings query for the given session so scoped admins fetch only
  // their own data: a kendra owner is limited to their center, a city_admin to
  // their city. Everyone else (super_admin, customer, mitra) fetches unscoped
  // and the views filter what they display.
  const bookingsQueryFor = (session: UserSession | null): string => {
    if (session?.role === 'kendra' && session.centerId) {
      return `/api/bookings?centerId=${encodeURIComponent(session.centerId)}`;
    }
    if (session?.role === 'city_admin' && session.cityId) {
      return `/api/bookings?cityId=${encodeURIComponent(session.cityId)}`;
    }
    return '/api/bookings';
  };

  // Load All Data from Cloud SQL Postgres via API
  const loadDataFromDb = async (session: UserSession | null = currentUser) => {
    try {
      setIsLoading(true);
      const [
        sweetsRes,
        citiesRes,
        centersRes,
        distCentersRes,
        saleCenterSweetsRes,
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
        fetch('/api/distribution-centers'),
        fetch('/api/sale-center-sweets'),
        fetch('/api/festivals'),
        fetch('/api/mitra-applications'),
        fetch(bookingsQueryFor(session)),
        fetch('/api/audit-logs'),
        fetch('/api/notification-templates'),
        fetch('/api/discounts')
      ]);

      // Users load independently — endpoint may not exist until migration ran.
      try {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const data = await usersRes.json();
          if (Array.isArray(data)) setUsers(data);
        }
      } catch (e) {
        console.warn('Users endpoint unavailable (pre-migration?):', e);
      }

      // The database is the single source of truth. Always apply whatever the
      // API returns, including empty arrays — an empty result means the table is
      // genuinely empty and the UI should reflect that rather than fall back to
      // demo data.
      if (sweetsRes.ok) {
        const data = await sweetsRes.json();
        if (Array.isArray(data)) setMasterSweets(data);
      }
      if (citiesRes.ok) {
        const data = await citiesRes.json();
        if (Array.isArray(data)) setCities(data);
      }
      if (centersRes.ok) {
        const data = await centersRes.json();
        if (Array.isArray(data)) setSaleCenters(data);
      }
      if (distCentersRes.ok) {
        const data = await distCentersRes.json();
        if (Array.isArray(data)) setDistributionCenters(data);
      }
      if (saleCenterSweetsRes.ok) {
        const data = await saleCenterSweetsRes.json();
        if (Array.isArray(data)) setSaleCenterSweets(data);
      }
      if (festivalsRes.ok) {
        const data = await festivalsRes.json();
        if (Array.isArray(data)) setFestivals(data);
      }
      if (mitrasRes.ok) {
        const data = await mitrasRes.json();
        if (Array.isArray(data)) setMitras(data);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        if (Array.isArray(data)) setBookings(data);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        if (Array.isArray(data)) setAuditLogs(data);
      }
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        if (Array.isArray(data)) setNotificationTemplates(data);
      }
      if (discountsRes.ok) {
        const data = await discountsRes.json();
        if (Array.isArray(data)) setDiscounts(data);
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
      // Resolve the mitra to a users row so the center references it by FK
      // rather than duplicating the owner's name/phone/email.
      const ownerUser = await resolveOrCreateUser({
        name: appToUpdate.fullName,
        phone: appToUpdate.phone,
        email: appToUpdate.email,
        role: 'kendra',
        cityId: appToUpdate.cityId,
        pincode: appToUpdate.pincode,
        address: appToUpdate.address,
      });
      const newCenter: SaleCenter = {
        id: centerId,
        cityId: appToUpdate.cityId,
        nameHi: `${appToUpdate.fullName} सहकार मित्र केंद्र`,
        nameEn: `${appToUpdate.fullName} Mitra Kendra`,
        type: 'mitra_kendra',
        ownerName: `${appToUpdate.fullName} (सहकार मित्र)`,
        ownerPhone: appToUpdate.phone,
        ownerEmail: appToUpdate.email,
        ownerUserId: ownerUser?.id,
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

  const updateSaleCenter = async (updated: SaleCenter) => {
    setSaleCenters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    try {
      await fetch(`/api/sale-centers/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error('Error updating sale center in DB:', e);
    }
    logAction('सुपर एडमिन', `बिक्री केंद्र ${updated.nameHi} का विवरण अद्यतन (Edit) किया गया`);
  };

  const createDistributionCenter = async (centerData: Omit<DistributionCenter, 'id'>) => {
    const id = `dc_${Date.now()}`;
    const newCenter: DistributionCenter = { ...centerData, id };
    setDistributionCenters((prev) => [...prev, newCenter]);
    try {
      await fetch('/api/distribution-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCenter)
      });
    } catch (e) {
      console.error('Error creating distribution center in DB:', e);
    }
    logAction('शहर एडमिन', `नया वितरण केंद्र ${centerData.nameHi} जोड़ा गया`);
    return id;
  };

  const updateDistributionCenter = async (updated: DistributionCenter) => {
    setDistributionCenters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    try {
      await fetch(`/api/distribution-centers/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error('Error updating distribution center in DB:', e);
    }
    logAction('सुपर एडमिन', `वितरण केंद्र ${updated.nameHi} का विवरण अद्यतन (Edit) किया गया`);
  };

  const deleteDistributionCenter = async (id: string) => {
    const target = distributionCenters.find((c) => c.id === id);
    setDistributionCenters((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/distribution-centers/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting distribution center in DB:', e);
    }
    logAction('सुपर एडमिन', `वितरण केंद्र ${target?.nameHi || id} हटाया गया`);
  };

  // Sweets belonging to a given sale centre (its menu + pricing).
  const getSaleCenterSweets = (saleCenterId: string) =>
    saleCenterSweets.filter((s) => s.saleCenterId === saleCenterId);

  // Set/insert a sweet's price + availability for a single sale centre.
  const updateSaleCenterSweetPrice = async (
    saleCenterId: string,
    sweetId: string,
    price: number,
    isActive: boolean
  ) => {
    setSaleCenterSweets((prev) => {
      const idx = prev.findIndex((s) => s.saleCenterId === saleCenterId && s.sweetId === sweetId);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { saleCenterId, sweetId, pricePerKg: price, isActive };
        return next;
      }
      return [...prev, { saleCenterId, sweetId, pricePerKg: price, isActive }];
    });

    try {
      await fetch('/api/sale-center-sweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleCenterId, sweetId, pricePerKg: price, isActive })
      });
    } catch (e) {
      console.error('Error updating sale centre sweet price in DB:', e);
    }
    logAction('शहर एडमिन', `बिक्री केंद्र ${saleCenterId} में मिठाई ${sweetId} का मूल्य ₹${price} निर्धारित किया`);
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

    // Seed the new sweet into every sale centre's menu at its default price so
    // it is available for per-centre pricing edits. Availability defaults to
    // active; operators can toggle/adjust per centre.
    const defaultPrice = sweet.basePrice || 600;
    const newRows = saleCenters
      .filter((center) => !saleCenterSweets.some((s) => s.saleCenterId === center.id && s.sweetId === sweet.id))
      .map((center) => ({
        saleCenterId: center.id,
        sweetId: sweet.id,
        pricePerKg: defaultPrice,
        isActive: true,
      }));

    if (newRows.length) {
      setSaleCenterSweets((prev) => [...prev, ...newRows]);
      for (const row of newRows) {
        fetch('/api/sale-center-sweets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row)
        }).catch((e) => console.error('Error seeding sale centre sweet in DB:', e));
      }
    }

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
    // The pickup point is now a distribution centre. Resolve it first, then fall
    // back to a sale centre (legacy ids) so old callers keep working.
    const distributionCenter =
      distributionCenters.find((dc) => dc.id === centerId) ||
      distributionCenters.find((dc) => dc.cityId === activeCity?.id && dc.isActive);

    const parentSaleCenter = distributionCenter
      ? saleCenters.find((c) => c.id === distributionCenter.saleCenterId)
      : undefined;

    // Build a unified pickup snapshot from the distribution centre when available,
    // otherwise from a sale centre (legacy) or a safe default.
    const pickup = distributionCenter
      ? {
          id: distributionCenter.id,
          saleCenterId: distributionCenter.saleCenterId,
          nameHi: distributionCenter.nameHi,
          nameEn: distributionCenter.nameEn,
          addressHi: distributionCenter.addressHi,
          addressEn: distributionCenter.addressEn,
          phone: distributionCenter.phone,
        }
      : (() => {
          const legacy =
            saleCenters.find((c) => c.id === centerId) ||
            saleCenters.find((c) => c.cityId === activeCity?.id) ||
            saleCenters[0];
          return {
            id: legacy?.id || centerId || 'center_default',
            saleCenterId: legacy?.id,
            nameHi: legacy?.nameHi || 'मुख्य वितरण केंद्र (सहकार केंद्र)',
            nameEn: legacy?.nameEn || 'Main Distribution Centre',
            addressHi: legacy?.addressHi || (activeCity?.nameHi ? `${activeCity.nameHi}, राजस्थान` : 'जयपुर, राजस्थान'),
            addressEn: legacy?.addressEn || 'Jaipur, Rajasthan',
            phone: legacy?.ownerPhone || '9829012345',
          };
        })();

    const totalKg = cart.reduce((acc, i) => acc + (i.variantKg || 0) * (i.quantity || 0), 0);
    const cartSubtotal = cart.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const subtotalAmount = discountDetails?.subtotalAmount ?? cartSubtotal;
    const discountAmount = discountDetails?.discountAmount ?? 0;
    const discountCode = discountDetails?.discountCode;
    const finalTotalAmount = Math.max(0, subtotalAmount - discountAmount);

    const bookingNum = Math.floor(1000 + Math.random() * 9000);
    const id = `#PB-${bookingNum}`;

    // Resolve the customer (and mitra) to users-table rows for FK references.
    let customerUserId: string | undefined;
    let mitraUserId: string | undefined;
    if (customer?.phone) {
      const custUser = await resolveOrCreateUser({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        role: 'customer',
        pincode: customer.pincode,
        address: customer.address,
      });
      customerUserId = custUser?.id;
    }
    if (mitraId) {
      const mitra = mitras.find((m) => m.id === mitraId);
      if (mitra?.phone) {
        const mitraUser = await resolveOrCreateUser({ name: mitraName || mitra.fullName, phone: mitra.phone, email: mitra.email, role: 'mitra', cityId: mitra.cityId });
        mitraUserId = mitraUser?.id;
      }
    }
    let pickupMitraUserId: string | undefined;
    const pickupMitraId = pickupDetails?.pickupMitraId;
    if (pickupMitraId) {
      const pMitra = mitras.find((m) => m.id === pickupMitraId);
      if (pMitra?.phone) {
        const pUser = await resolveOrCreateUser({ name: pickupDetails?.pickupMitraName || pMitra.fullName, phone: pMitra.phone, email: pMitra.email, role: 'mitra', cityId: pMitra.cityId });
        pickupMitraUserId = pUser?.id;
      }
    }

    const newBooking: Booking = {
      id,
      festivalId: activeFestival ? activeFestival.id : 'diwali_2026',
      festivalNameHi: activeFestival ? activeFestival.nameHi : 'दीपावली 2026',
      festivalNameEn: activeFestival ? activeFestival.nameEn : 'Diwali 2026',
      cityId: activeCity ? activeCity.id : 'jaipur',
      cityNameHi: activeCity ? activeCity.nameHi : 'जयपुर',
      cityNameEn: activeCity ? activeCity.nameEn : 'Jaipur',
      centerId: pickup.id,
      saleCenterId: pickup.saleCenterId || parentSaleCenter?.id,
      centerNameHi: pickup.nameHi || 'सहकार केंद्र',
      centerNameEn: pickup.nameEn || 'Sahakar Center',
      centerAddressHi: pickup.addressHi || 'जयपुर, राजस्थान',
      centerAddressEn: pickup.addressEn || 'Jaipur, Rajasthan',
      centerPhone: pickup.phone || '9829012345',
      bookedByRole,
      mitraId,
      mitraName,
      mitraUserId,
      customerUserId,
      pickupMode: pickupDetails?.pickupMode || 'self',
      pickupMitraId: pickupDetails?.pickupMitraId,
      pickupMitraName: pickupDetails?.pickupMitraName,
      pickupMitraUserId,
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
        distributionCenters,
        activeSaleCenterId,
        setActiveSaleCenterId,
        activeDistributionCenterId,
        setActiveDistributionCenterId,
        createDistributionCenter,
        updateDistributionCenter,
        deleteDistributionCenter,
        saleCenterSweets,
        getSaleCenterSweets,
        mitras,
        users,
        resolveOrCreateUser,
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
        updateSaleCenter,
        updateSaleCenterSweetPrice,
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

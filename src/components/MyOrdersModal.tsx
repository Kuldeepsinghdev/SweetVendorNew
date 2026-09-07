/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CachedImage } from './CachedImage';
import { Booking } from '../types';
import { PrintReceiptModal } from './PrintReceiptModal';
import {
  X,
  Package,
  Search,
  Calendar,
  MapPin,
  Phone,
  QrCode,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  User,
  Users,
  Copy,
  Check,
  Building2,
  FileText
} from 'lucide-react';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSearchPhone?: string;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  defaultSearchPhone
}) => {
  const { bookings, currentUser, language } = useApp();

  const [searchQuery, setSearchQuery] = useState(defaultSearchPhone || currentUser?.phone || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_pickup' | 'delivered' | 'cancelled'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Selected booking for PrintReceiptModal
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter user bookings based on currentUser or search query
  const getUserBookings = () => {
    let result = bookings;

    // Filter by role if logged in
    if (currentUser) {
      if (currentUser.role === 'customer') {
        result = bookings.filter((b) => {
          const matchPhone = currentUser.phone && b.customer?.phone?.includes(currentUser.phone);
          const matchName = currentUser.name && b.customer?.name?.toLowerCase().includes(currentUser.name.toLowerCase());
          return b.bookedByRole === 'customer' || matchPhone || matchName;
        });
      } else if (currentUser.role === 'mitra') {
        result = bookings.filter((b) => {
          const matchMitraId = currentUser.id && b.mitraId === currentUser.id;
          const matchMitraName = currentUser.name && b.mitraName?.toLowerCase().includes(currentUser.name.toLowerCase());
          const matchPhone = currentUser.phone && b.customer?.phone?.includes(currentUser.phone);
          return matchMitraId || matchMitraName || matchPhone;
        });
      }
    } else {
      result = [];
    }

    // Additional user search filter (Order ID, phone, customer name, center name)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.customer?.phone?.includes(q) ||
          b.customer?.name?.toLowerCase().includes(q) ||
          b.centerNameHi?.toLowerCase().includes(q) ||
          b.deliveryOtp?.includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const userBookings = getUserBookings();

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleShareWhatsApp = (b: Booking) => {
    const text = language === 'hi'
      ? `*सहकार भारती — प्री-बुकिंग रसीद*\nऑर्डर नंबर: ${b.id}\nग्राहक: ${b.customer?.name || ''}\nकुल मात्रा: ${b.totalKg} kg | राशि: ₹${b.totalAmount}\nसंग्रह केंद्र: ${b.centerNameHi}\nसंग्रह तिथि: ${b.pickupDate}\nडिलीवरी OTP: ${b.deliveryOtp}`
      : `*Sahakar Bharati — Pre-booking Receipt*\nOrder ID: ${b.id}\nCustomer: ${b.customer?.name || ''}\nQuantity: ${b.totalKg} kg | Amount: ₹${b.totalAmount}\nPickup Center: ${b.centerNameHi}\nPickup Date: ${b.pickupDate}\nDelivery OTP: ${b.deliveryOtp}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
          
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-orange-950 via-amber-900 to-orange-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-amber-500/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md border border-white">
                <Package className="w-6 h-6 text-orange-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-amber-200 leading-tight">
                  {language === 'hi' ? 'मेरे पिछले ऑर्डर एवं रसीद विवरण' : 'My Order History & Receipts'}
                </h3>
                <p className="text-[11px] text-amber-100/80">
                  {currentUser
                    ? `${currentUser?.name || ''} (${currentUser?.role === 'customer' ? (language === 'hi' ? 'ग्राहक' : 'Customer') : (language === 'hi' ? 'सहकार मित्र' : 'Sahakar Mitra')}) ${language === 'hi' ? 'के सभी ऑर्डर' : 'all orders'}`
                    : language === 'hi'
                    ? 'मोबाइल नंबर या ऑर्डर आईडी से पिछले बुकिंग देखें'
                    : 'Track previous bookings by phone or order ID'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 sm:p-4 bg-amber-50/50 border-b border-amber-200 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    language === 'hi'
                      ? 'ऑर्डर #PB, मोबाइल न., या नाम से खोजें...'
                      : 'Search by Order #PB, Mobile or Name...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', labelHi: 'सभी', labelEn: 'All' },
                  { id: 'pending_pickup', labelHi: 'पेंडिंग पिकअप', labelEn: 'Pending' },
                  { id: 'delivered', labelHi: 'डिलीवर', labelEn: 'Delivered' },
                  { id: 'cancelled', labelHi: 'निरस्त', labelEn: 'Cancelled' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-amber-900 text-amber-200 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? tab.labelHi : tab.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Content / Orders List */}
          <div className="p-3 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/50">
            {userBookings.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto font-black">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">
                  {language === 'hi' ? 'कोई पिछले ऑर्डर नहीं मिले' : 'No Previous Orders Found'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'hi'
                    ? 'कृपया अपने मोबाइल नंबर की जांच करें या नई मिठाई प्री-बुकिंग शुरू करें।'
                    : 'Check mobile search number or start a new pre-booking.'}
                </p>
              </div>
            ) : (
              (userBookings || []).map((booking) => {
                const isExpanded = expandedBookingId === booking.id || userBookings.length === 1;

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-xs transition-all overflow-hidden"
                  >
                    {/* Order Summary Header Card */}
                    <div
                      onClick={() => setExpandedBookingId(isExpanded && userBookings.length > 1 ? null : booking.id)}
                      className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-50/60 to-white flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-orange-950" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm text-slate-900">
                              {booking.id}
                            </span>

                            {/* Status Badge */}
                            {booking.status === 'delivered' ? (
                              <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>{language === 'hi' ? 'डिलीवर (Delivered)' : 'Delivered'}</span>
                              </span>
                            ) : booking.status === 'cancelled' ? (
                              <span className="bg-rose-100 text-rose-800 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-300">
                                <AlertCircle className="w-3 h-3 text-rose-700" />
                                <span>{language === 'hi' ? 'निरस्त' : 'Cancelled'}</span>
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-800" />
                                <span>{language === 'hi' ? 'पेंडिंग पिकअप' : 'Pending Pickup'}</span>
                              </span>
                            )}

                            {/* OTP Pill */}
                            <span className="bg-slate-900 text-amber-300 font-mono text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-amber-400" />
                              <span>OTP: {booking.deliveryOtp}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1 flex-wrap">
                            <span>{booking.createdAt}</span>
                            <span>•</span>
                            <span>{language === 'hi' ? booking.cityNameHi : booking.cityNameEn || booking.cityNameHi}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-800">{language === 'hi' ? booking.centerNameHi : booking.centerNameEn || booking.centerNameHi}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-black text-base text-blue-950">
                            ₹{booking.totalAmount}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-slate-500">
                            {booking.totalKg} kg ({booking.items.length} {language === 'hi' ? 'आइटम' : 'items'})
                          </div>
                        </div>

                        <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-950 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Expanded View */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-4 text-xs font-sans border-t border-slate-100 animate-in fade-in duration-150">
                        
                        {/* Section 1: Customer & Pickup Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80">
                          <div>
                            <div className="font-bold text-amber-950 uppercase font-mono text-[10.5px] tracking-wider mb-1 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-orange-700" />
                              <span>{language === 'hi' ? 'ग्राहक विवरण' : 'Customer Info'}</span>
                            </div>
                            <div className="space-y-0.5 font-semibold text-slate-800">
                              <div>नाम: <span className="font-bold">{booking.customer?.name || ''}</span></div>
                              <div className="font-mono">मोबाइल: {booking.customer?.phone || ''}</div>
                              {booking.customer?.address && <div className="text-[11px] text-slate-600">पता: {booking.customer.address}</div>}
                              {booking.mitraName && (
                                <div className="text-[11px] text-amber-900 font-bold mt-1 pt-1 border-t border-amber-200">
                                  सहकार मित्र: {booking.mitraName}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="font-bold text-amber-950 uppercase font-mono text-[10.5px] tracking-wider mb-1 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{language === 'hi' ? 'संग्रह केंद्र (Pickup Center)' : 'Pickup Center'}</span>
                            </div>
                            <div className="space-y-0.5 text-slate-800">
                              <div className="font-bold text-slate-900">{language === 'hi' ? booking.centerNameHi : booking.centerNameEn || booking.centerNameHi}</div>
                              <div className="text-[11px] text-slate-600 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                <span>{language === 'hi' ? booking.centerAddressHi : booking.centerAddressEn || booking.centerAddressHi}</span>
                              </div>
                              <div className="font-mono text-[11px] text-slate-700 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>{booking.centerPhone}</span>
                              </div>
                              <div className="font-bold text-amber-900 text-[11px] pt-1 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-orange-700" />
                                <span>निर्धारित तिथि: {booking.pickupDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Items Table */}
                        <div>
                          <div className="font-bold text-xs uppercase text-slate-900 font-mono tracking-wider mb-2 flex items-center gap-1.5">
                            <ShoppingBag className="w-4 h-4 text-orange-600" />
                            <span>{language === 'hi' ? 'ऑर्डर की गई मिठाइयां (Item Breakdown)' : 'Items Ordered'}</span>
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-700 font-mono text-[10.5px] uppercase border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">{language === 'hi' ? 'मिठाई' : 'Sweet'}</th>
                                  <th className="p-2.5 text-center">{language === 'hi' ? 'पैकिंग' : 'Variant'}</th>
                                  <th className="p-2.5 text-center">{language === 'hi' ? 'मात्रा' : 'Qty'}</th>
                                  <th className="p-2.5 text-right">{language === 'hi' ? 'दर' : 'Rate'}</th>
                                  <th className="p-2.5 text-right">{language === 'hi' ? 'कुल' : 'Total'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(booking?.items || []).map((item, idx) => (
                                  <tr key={idx} className="hover:bg-amber-50/30">
                                    <td className="p-2.5">
                                      <div className="flex items-center gap-2.5">
                                        {item.imageUrl && (
                                          <CachedImage
                                            src={item.imageUrl}
                                            alt={item.sweetNameHi}
                                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                          />
                                        )}
                                        <div>
                                          <span className="font-bold text-slate-900 block leading-tight">
                                            {language === 'hi' ? item.sweetNameHi : item.sweetNameEn}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold text-orange-950">
                                      {item.variantLabel}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-extrabold text-slate-800">
                                      {item.quantity}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-slate-600">
                                      ₹{item.pricePerKg}/kg
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-extrabold text-blue-950">
                                      ₹{item.totalAmount}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Section 3: Payment & Summary Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                            <div>
                              भुगतान तरीका:{' '}
                              <span className="font-bold uppercase text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 font-mono">
                                {booking.paymentMethod}
                              </span>
                            </div>
                            <div>
                              स्थिति:{' '}
                              <span className="font-bold text-emerald-800">
                                {booking.paymentStatus === 'paid' ? 'भुगतान पूर्ण (Paid)' : 'पिकअप पर भुगतान (Pay on Pickup)'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleCopyOrderId(booking.id)}
                              className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                              title="ऑर्डर नंबर कॉपी करें"
                            >
                              {copiedOrderId === booking.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                              <span>{copiedOrderId === booking.id ? 'कॉपी हो गया' : 'ID कॉपी'}</span>
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(booking)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => setSelectedReceiptBooking(booking)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-lg shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                              <Printer className="w-4 h-4" />
                              <span>{language === 'hi' ? 'रसीद देखें / प्रिंट' : 'Print Receipt'}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-slate-900 text-amber-200 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs font-mono">
            <div>
              कुल मिले ऑर्डर: <span className="font-extrabold text-white text-sm">{userBookings.length}</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>

        </div>
      </div>

      {/* Print Receipt Modal integration */}
      <PrintReceiptModal
        booking={selectedReceiptBooking}
        onClose={() => setSelectedReceiptBooking(null)}
      />
    </>
  );
};

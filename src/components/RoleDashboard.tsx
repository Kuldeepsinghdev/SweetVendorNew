/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { hasPermission, Action } from '../lib/permissions';
import {
  ShoppingBag,
  Users,
  Store,
  Building2,
  Crown,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Lock
} from 'lucide-react';

interface WidgetProps {
  title: string;
  titleHi: string;
  value: string | number;
  subtitle?: string;
  subtitleHi?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

const Widget: React.FC<WidgetProps> = ({
  title,
  titleHi,
  value,
  subtitle,
  subtitleHi,
  icon: Icon,
  color,
  trend
}) => {
  const { language } = useApp();
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {language === 'hi' ? titleHi : title}
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">
              {language === 'hi' ? subtitleHi : subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

interface QuickActionProps {
  label: string;
  labelHi: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const QuickAction: React.FC<QuickActionProps> = ({
  label,
  labelHi,
  icon: Icon,
  onClick,
  disabled,
  variant = 'primary'
}) => {
  const { language } = useApp();
  
  const variantStyles = {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Icon className="w-4 h-4" />
      <span>{language === 'hi' ? labelHi : label}</span>
    </button>
  );
};

interface PermissionGateProps {
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ action, children, fallback }) => {
  const { currentUser } = useApp();
  const role = currentUser?.role || 'common';
  
  if (!hasPermission(role, action)) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};

export const RoleDashboard: React.FC = () => {
  const {
    language,
    currentUser,
    role,
    bookings,
    cities,
    saleCenters,
    mitras,
    activeFestival,
    isBookingWindowOpen
  } = useApp();
  
  const userRole = currentUser?.role || 'common';
  
  // Calculate stats based on role
  const getBookingStats = () => {
    let filteredBookings = bookings;
    
    if (userRole === 'customer') {
      filteredBookings = bookings.filter(
        (b) => currentUser?.phone && b.customer?.phone?.includes(currentUser.phone)
      );
    } else if (userRole === 'mitra') {
      filteredBookings = bookings.filter(
        (b) => b.mitraId === currentUser?.id || (currentUser?.name && b.mitraName?.toLowerCase().includes(currentUser.name.toLowerCase()))
      );
    } else if (userRole === 'kendra') {
      // Kendra sees bookings for their center
      filteredBookings = bookings; // In real app, filter by center
    }
    
    return {
      total: filteredBookings.length,
      pending: filteredBookings.filter((b) => b.status === 'confirmed').length,
      delivered: filteredBookings.filter((b) => b.status === 'delivered').length,
      totalAmount: filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0),
      totalKg: filteredBookings.reduce((sum, b) => sum + b.totalKg, 0),
    };
  };
  
  const stats = getBookingStats();
  
  // Role-specific widgets
  const getWidgetsForRole = (): WidgetProps[] => {
    const widgets: WidgetProps[] = [];
    
    // Booking stats (all logged-in users)
    if (hasPermission(userRole, 'booking:view_own')) {
      widgets.push({
        title: 'Total Bookings',
        titleHi: 'कुल बुकिंग',
        value: stats.total,
        subtitle: userRole === 'customer' ? 'Your orders' : 'All orders',
        subtitleHi: userRole === 'customer' ? 'आपके ऑर्डर' : 'सभी ऑर्डर',
        icon: Package,
        color: 'bg-blue-500',
      });
      
      widgets.push({
        title: 'Pending Pickup',
        titleHi: 'पिकअप लंबित',
        value: stats.pending,
        subtitle: 'Awaiting delivery',
        subtitleHi: 'वितरण लंबित',
        icon: Clock,
        color: 'bg-orange-500',
      });
      
      widgets.push({
        title: 'Delivered',
        titleHi: 'वितरित',
        value: stats.delivered,
        subtitle: 'Completed orders',
        subtitleHi: 'पूर्ण ऑर्डर',
        icon: CheckCircle2,
        color: 'bg-emerald-500',
      });
    }
    
    // Admin-specific widgets
    if (hasPermission(userRole, 'reports:view_city')) {
      widgets.push({
        title: 'Total Value',
        titleHi: 'कुल मूल्य',
        value: `₹${stats.totalAmount.toLocaleString('en-IN')}`,
        subtitle: 'Booking value',
        subtitleHi: 'बुकिंग मूल्य',
        icon: IndianRupee,
        color: 'bg-purple-500',
      });
      
      widgets.push({
        title: 'Total Weight',
        titleHi: 'कुल वजन',
        value: `${(stats.totalKg / 1000).toFixed(2)} tonnes`,
        subtitle: 'Booked sweets',
        subtitleHi: 'बुक की गई मिठाई',
        icon: BarChart3,
        color: 'bg-cyan-500',
      });
    }
    
    // City admin widgets
    if (userRole === 'city_admin') {
      widgets.push({
        title: 'Sale Centers',
        titleHi: 'बिक्री केंद्र',
        value: saleCenters.filter((c) => c.isActive).length,
        subtitle: 'Active centers',
        subtitleHi: 'सक्रिय केंद्र',
        icon: Store,
        color: 'bg-indigo-500',
      });
      
      widgets.push({
        title: 'Mitra Agents',
        titleHi: 'सहकार मित्र',
        value: mitras.filter((m) => m.status === 'approved').length,
        subtitle: 'Active agents',
        subtitleHi: 'सक्रिय एजेंट',
        icon: Users,
        color: 'bg-amber-500',
      });
    }
    
    // Super admin widgets
    if (userRole === 'super_admin') {
      widgets.push({
        title: 'Active Cities',
        titleHi: 'सक्रिय शहर',
        value: cities.filter((c) => c.isActive).length,
        subtitle: 'Across all states',
        subtitleHi: 'सभी राज्यों में',
        icon: Building2,
        color: 'bg-rose-500',
      });
    }
    
    return widgets;
  };
  
  // Quick actions based on role
  const getQuickActions = (): QuickActionProps[] => {
    const actions: QuickActionProps[] = [];
    
    if (hasPermission(userRole, 'booking:create')) {
      actions.push({
        label: 'New Booking',
        labelHi: 'नई बुकिंग',
        icon: ShoppingBag,
        onClick: () => {},
        variant: 'primary',
      });
    }
    
    if (hasPermission(userRole, 'booking:deliver')) {
      actions.push({
        label: 'Scan QR',
        labelHi: 'QR स्कैन',
        icon: Package,
        onClick: () => {},
        variant: 'success',
      });
    }
    
    if (hasPermission(userRole, 'reports:view_city')) {
      actions.push({
        label: 'View Reports',
        labelHi: 'रिपोर्ट देखें',
        icon: FileText,
        onClick: () => {},
        variant: 'secondary',
      });
    }
    
    if (hasPermission(userRole, 'settings:toggle_booking')) {
      actions.push({
        label: isBookingWindowOpen ? 'Close Booking' : 'Open Booking',
        labelHi: isBookingWindowOpen ? 'बुकिंग बंद करें' : 'बुकिंग खोलें',
        icon: Settings,
        onClick: () => {},
        variant: isBookingWindowOpen ? 'danger' : 'success',
      });
    }
    
    return actions;
  };
  
  const widgets = getWidgetsForRole();
  const quickActions = getQuickActions();
  
  if (!currentUser) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">
              {language === 'hi' ? `नमस्ते, ${currentUser.name}!` : `Welcome, ${currentUser.name}!`}
            </h2>
            <p className="text-sm text-amber-100 mt-1">
              {language === 'hi' 
                ? `${activeFestival?.nameHi || 'उत्सव'} - ${role === 'super_admin' ? 'राष्ट्रीय सुपर एडमिन' : role === 'city_admin' ? 'नगर एडमिन' : role === 'kendra' ? 'बिक्री केंद्र' : role === 'mitra' ? 'सहकार मित्र' : 'ग्राहक'} डैशबोर्ड`
                : `${activeFestival?.nameEn || 'Festival'} - ${role} Dashboard`}
            </p>
          </div>
          <div className="hidden sm:block">
            {role === 'super_admin' && <Crown className="w-10 h-10 text-amber-200" />}
            {role === 'city_admin' && <Building2 className="w-10 h-10 text-amber-200" />}
            {role === 'kendra' && <Store className="w-10 h-10 text-amber-200" />}
            {role === 'mitra' && <Users className="w-10 h-10 text-amber-200" />}
            {role === 'customer' && <ShoppingBag className="w-10 h-10 text-amber-200" />}
          </div>
        </div>
      </div>
      
      {/* Stats Widgets Grid */}
      {widgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {widgets.map((widget, idx) => (
            <Widget key={idx} {...widget} />
          ))}
        </div>
      )}
      
      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">
            {language === 'hi' ? 'त्वरित कार्य' : 'Quick Actions'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <QuickAction key={idx} {...action} />
            ))}
          </div>
        </div>
      )}
      
      {/* Permissions Info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          <span>
            {language === 'hi' 
              ? `आपकी भूमिका (${currentUser.role}) के अनुसार सभी सुविधाएं दिखाई जा रही हैं।`
              : `Showing features based on your role (${currentUser.role}).`}
          </span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  // Ẩm thực & Sinh hoạt
  Utensils, Coffee, Pizza, Apple, Flame,
  // Mua sắm & Tiêu dùng
  ShoppingBag, ShoppingCart, Gift, Tag, Store,
  // Di chuyển
  Car, Bus, Fuel, Plane, Bike,
  // Nhà cửa & Hóa đơn
  Home, Zap, Droplet, Wifi, Phone,
  // Học tập & Giáo dục
  GraduationCap, BookOpen, Book, Award,
  // Công nghệ & Thiết bị
  Laptop, Server, Smartphone, Cpu,
  // Sức khỏe & Y tế
  HeartPulse, Stethoscope, Pill, Activity,
  // Thu nhập & Tài chính
  Briefcase, DollarSign, Wallet, TrendingUp, Coins, Banknote, CreditCard,
  // Giải trí & Đời sống
  Film, Gamepad2, Music, Tv, Camera,
  // Dự phòng & Khác
  MoreHorizontal, Sparkles, Smile, ShieldCheck, Folder, CircleDollarSign
} from 'lucide-react';

export const ICON_MAP = {
  // Thu nhập
  Briefcase, Award, Laptop, Gift, TrendingUp, DollarSign, Wallet, Coins, Banknote, CreditCard,
  // Chi tiêu ẩm thực & nhà cửa
  Utensils, Coffee, Pizza, Apple, Flame, Home, Zap, Droplet, Wifi, Phone,
  // Mua sắm & giáo dục
  ShoppingBag, ShoppingCart, Tag, Store, GraduationCap, BookOpen, Book,
  // Di chuyển & công nghệ
  Car, Bus, Fuel, Plane, Bike, Server, Smartphone, Cpu,
  // Y tế & giải trí
  HeartPulse, Stethoscope, Pill, Activity, Film, Gamepad2, Music, Tv, Camera,
  // Khác
  MoreHorizontal, Sparkles, Smile, ShieldCheck, Folder, CircleDollarSign
};

/**
 * Hiển thị Category Icon với cơ chế fallback an toàn
 */
export function CategoryIcon({ name, size = 18, className = '', color }) {
  const IconComponent = ICON_MAP[name] || Folder;
  return <IconComponent size={size} className={className} style={color ? { color } : undefined} />;
}

/**
 * Hiển thị Wallet Icon dựa trên loại ví
 */
export function WalletIcon({ walletId, size = 16, className = '' }) {
  switch (walletId) {
    case 'cash':
      return <Banknote size={size} className={`text-emerald-500 ${className}`} />;
    case 'bank':
      return <CreditCard size={size} className={`text-blue-500 ${className}`} />;
    case 'ewallet':
      return <Smartphone size={size} className={`text-pink-500 ${className}`} />;
    default:
      return <Wallet size={size} className={`text-slate-500 ${className}`} />;
  }
}

/**
 * Pill nhãn danh mục hoàn chỉnh có nền mờ cùng màu
 */
export function CategoryBadge({ name, icon, color = '#6B7280', size = 'sm' }) {
  const isSmall = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        isSmall ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
      style={{
        backgroundColor: `${color}18`, // Opacity ~10%
        color: color,
        border: `1px solid ${color}30`
      }}
    >
      <CategoryIcon name={icon} size={isSmall ? 13 : 15} color={color} />
      <span>{name}</span>
    </span>
  );
}

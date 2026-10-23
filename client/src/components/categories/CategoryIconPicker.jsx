import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ICON_MAP } from '../../utils/iconResolver';

export const PALETTE_COLORS = [
  '#10B981', // Emerald (Lương, Thu nhập)
  '#059669', // Dark Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue (Công nghệ)
  '#6366F1', // Indigo (Nhà ở)
  '#8B5CF6', // Violet (Giáo dục)
  '#A855F7', // Purple
  '#EC4899', // Pink (Giải trí)
  '#F43F5E', // Rose
  '#EF4444', // Red (Ăn uống)
  '#F97316', // Orange (Mua sắm)
  '#F59E0B', // Amber
  '#EAB308', // Yellow (Xăng xe)
  '#84CC16', // Lime
  '#6B7280'  // Gray (Khác)
];

const CATEGORIZED_ICONS = [
  { group: 'Ẩm thực & Sinh hoạt', icons: ['Utensils', 'Coffee', 'Pizza', 'Apple', 'Home', 'Zap', 'Droplet', 'Wifi', 'Flame'] },
  { group: 'Mua sắm & Giải trí', icons: ['ShoppingBag', 'ShoppingCart', 'Gift', 'Tag', 'Film', 'Gamepad2', 'Music', 'Tv', 'Camera'] },
  { group: 'Học tập & Công nghệ', icons: ['GraduationCap', 'BookOpen', 'Book', 'Award', 'Laptop', 'Server', 'Smartphone', 'Cpu'] },
  { group: 'Di chuyển & Xăng xe', icons: ['Car', 'Bus', 'Fuel', 'Plane', 'Bike'] },
  { group: 'Y tế & Sức khỏe', icons: ['HeartPulse', 'Stethoscope', 'Pill', 'Activity'] },
  { group: 'Thu nhập & Tài chính', icons: ['Briefcase', 'TrendingUp', 'DollarSign', 'Wallet', 'Coins', 'Banknote', 'CreditCard'] },
  { group: 'Khác', icons: ['MoreHorizontal', 'Sparkles', 'Smile', 'ShieldCheck', 'Folder', 'CircleDollarSign'] }
];

export default function CategoryIconPicker({ selectedIcon, onSelectIcon, currentColor = '#3B82F6' }) {
  const [search, setSearch] = useState('');

  const filteredGroups = CATEGORIZED_ICONS.map(group => ({
    ...group,
    icons: group.icons.filter(iconName => iconName.toLowerCase().includes(search.toLowerCase()))
  })).filter(group => group.icons.length > 0);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
      {/* Ô tìm kiếm icon */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm biểu tượng..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Lưới hiển thị các nhóm icon */}
      <div className="max-h-48 overflow-y-auto space-y-3 pr-1 text-xs">
        {filteredGroups.map(group => (
          <div key={group.group}>
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
              {group.group}
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
              {group.icons.map(iconName => {
                const IconComponent = ICON_MAP[iconName];
                if (!IconComponent) return null;
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => onSelectIcon(iconName)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                    title={iconName}
                  >
                    <IconComponent size={18} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

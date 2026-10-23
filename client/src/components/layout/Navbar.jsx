import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  FolderTree, 
  PiggyBank, 
  BarChart3,
  Server,
  Users
} from 'lucide-react';

export const BASE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, testName: 'Dashboard' },
  { id: 'transactions', label: 'Giao dịch', icon: Receipt, testName: 'Giao dịch' },
  { id: 'categories', label: 'Danh mục', icon: FolderTree, testName: 'Danh mục' },
  { id: 'budgets', label: 'Ngân sách', icon: PiggyBank, testName: 'Ngân sách' },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3, testName: 'Báo cáo' },
  { id: 'system', label: 'Kiến Trúc & API', icon: Server, testName: 'Kiến Trúc & API' }
];

export default function Navbar({ 
  activeTab, 
  onSelectTab, 
  budgetAlertCount = 0,
  mobileOpen = false,
  onCloseMobile
}) {
  const { isAdmin } = useAuth();

  const navItems = React.useMemo(() => {
    if (isAdmin) {
      return [
        ...BASE_NAV_ITEMS,
        { id: 'admin', label: 'Quản Trị Users', icon: Users, testName: 'Quản Trị Users' }
      ];
    }
    return BASE_NAV_ITEMS;
  }, [isAdmin]);
  return (
    <>
      {/* Desktop Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasAlert = item.id === 'budgets' && budgetAlertCount > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  data-nav-label={item.testName}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {hasAlert && (
                    <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-amber-500 text-white rounded-full">
                      {budgetAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80%] bg-white dark:bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl border-r border-slate-200 dark:border-slate-800">
            <div>
              <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Menu Chức Năng (Đề 38)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SV: Trần Mạnh Dũng
                </p>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const hasAlert = item.id === 'budgets' && budgetAlertCount > 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {hasAlert && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                          {budgetAlertCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Mã SV: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">DTC245160020</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, ShieldAlert } from 'lucide-react';
import { CategoryBadge, CategoryIcon } from '../../utils/iconResolver';
import CategoryIconPicker, { PALETTE_COLORS } from './CategoryIconPicker';

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories = [],
  onSaveCategory,
  onDeleteCategory
}) {
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  const [categoryIcon, setCategoryIcon] = useState('Utensils');
  const [categoryColor, setCategoryColor] = useState('#EF4444');
  const [errorMsg, setErrorMsg] = useState('');

  // Integrity Guard State khi xóa
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [transferTargetId, setTransferTargetId] = useState('');

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditId(null);
    setCategoryName('');
    setCategoryType(activeTab);
    setCategoryIcon(activeTab === 'expense' ? 'Utensils' : 'Briefcase');
    setCategoryColor(activeTab === 'expense' ? '#EF4444' : '#10B981');
    setErrorMsg('');
  };

  const handleStartEdit = (cat) => {
    setIsEditing(true);
    setEditId(cat.id);
    setCategoryName(cat.name);
    setCategoryType(cat.type);
    setCategoryIcon(cat.icon);
    setCategoryColor(cat.color);
    setErrorMsg('');
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditId(null);
    setErrorMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setErrorMsg('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      await onSaveCategory({
        ...(editId ? { id: editId } : {}),
        name: categoryName.trim(),
        type: categoryType,
        icon: categoryIcon,
        color: categoryColor
      });
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDeleteClick = (cat) => {
    setDeleteConfirmTarget(cat);
    // Chọn sẵn một danh mục thay thế cùng loại khác bản thân
    const alternatives = categories.filter(c => c.type === cat.type && c.id !== cat.id);
    setTransferTargetId(alternatives[0]?.id || '');
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      const hasTransactions = (deleteConfirmTarget.transactionCount || 0) > 0;
      await onDeleteCategory(
        deleteConfirmTarget.id,
        hasTransactions ? transferTargetId : null
      );
      setDeleteConfirmTarget(null);
    } catch (err) {
      alert(`Không thể xóa danh mục: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Quản lý danh mục thu / chi
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!isEditing ? (
            <>
              {/* Tabs Thu / Chi */}
              <div className="flex items-center justify-between">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('expense')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Chi tiêu ({categories.filter(c => c.type === 'expense').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('income')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Thu nhập ({categories.filter(c => c.type === 'income').length})
                  </button>
                </div>

                <button
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Thêm mới</span>
                </button>
              </div>

              {/* Danh sách danh mục */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={18} color={cat.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cat.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          {cat.isDefault && <span className="text-indigo-500 font-medium">Mặc định • </span>}
                          <span>{cat.transactionCount || 0} giao dịch</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg"
                        title="Sửa danh mục"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cat)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Form Thêm / Sửa Danh mục */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {editId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Quay lại danh sách
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800 rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Tên danh mục */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ví dụ: Cà phê & Gặp gỡ"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Loại danh mục */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Loại danh mục
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType('expense');
                      if (!editId) setCategoryColor('#EF4444');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      categoryType === 'expense'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType('income');
                      if (!editId) setCategoryColor('#10B981');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      categoryType === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>

              {/* Xem trước trực tiếp */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-500">Xem trước hiển thị:</span>
                <CategoryBadge
                  name={categoryName || 'Tên danh mục'}
                  icon={categoryIcon}
                  color={categoryColor}
                  size="md"
                />
              </div>

              {/* Bảng màu */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Chọn màu nhận diện
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PALETTE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryColor(color)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: color }}
                    >
                      {categoryColor === color && (
                        <Check size={14} className="text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-7 h-7 rounded-full p-0 border-0 cursor-pointer overflow-hidden"
                    title="Màu tùy chọn"
                  />
                </div>
              </div>

              {/* Bộ chọn Biểu tượng */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Chọn biểu tượng (Lucide Icons)
                </label>
                <CategoryIconPicker
                  selectedIcon={categoryIcon}
                  onSelectIcon={setCategoryIcon}
                  currentColor={categoryColor}
                />
              </div>

              {/* Nút Submit form */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  {editId ? 'Cập nhật danh mục' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* HỘP THOẠI CẢNH BÁO BẢO TOÀN TOÀN VẸN DỮ LIỆU KHI XÓA */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Bảo toàn toàn vẹn dữ liệu
                  </h4>
                  <p className="text-xs text-slate-500">
                    Danh mục: <strong>{deleteConfirmTarget.name}</strong>
                  </p>
                </div>
              </div>

              {(deleteConfirmTarget.transactionCount || 0) > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200">
                    Danh mục này đang chứa <strong>{deleteConfirmTarget.transactionCount} giao dịch</strong> liên kết. Hệ thống không cho phép xóa trực tiếp nhằm bảo vệ toàn vẹn dữ liệu và số dư ví.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Chọn danh mục thay thế để chuyển toàn bộ {deleteConfirmTarget.transactionCount} giao dịch sang:
                    </label>
                    <select
                      value={transferTargetId}
                      onChange={(e) => setTransferTargetId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories
                        .filter(c => c.type === deleteConfirmTarget.type && c.id !== deleteConfirmTarget.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Danh mục này hiện không có giao dịch nào liên kết. Bạn có chắc chắn muốn xóa không?
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
                >
                  {(deleteConfirmTarget.transactionCount || 0) > 0 ? 'Chuyển giao dịch & Xóa' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

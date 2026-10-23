/**
 * src/controllers/categoryController.js
 * Xử lý các yêu cầu HTTP liên quan đến danh mục thu / chi
 */

const categoryModel = require('../models/categoryModel');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const categoryController = {
  getCategories: asyncHandler(async (req, res) => {
    const { type } = req.query;
    const categories = categoryModel.getAll(type);
    res.json({
      success: true,
      data: categories
    });
  }),

  getCategoryById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = categoryModel.getById(id);
    if (!category) {
      throw ApiError.notFound(`Không tìm thấy danh mục với ID: ${id}`);
    }
    res.json({
      success: true,
      data: category
    });
  }),

  createCategory: asyncHandler(async (req, res) => {
    const { id, name, type, icon, color } = req.body;
    const created = categoryModel.create({ id, name, type, icon, color, is_default: 0 });
    res.status(201).json({
      success: true,
      data: created,
      message: 'Tạo danh mục thành công'
    });
  }),

  updateCategory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = categoryModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy danh mục với ID: ${id}`);
    }

    const updated = categoryModel.update(id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Cập nhật danh mục thành công'
    });
  }),

  deleteCategory: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const transferToCategoryId = req.query.transferToCategoryId || req.body.transferToCategoryId;

    const existing = categoryModel.getById(id);
    if (!existing) {
      throw ApiError.notFound(`Không tìm thấy danh mục với ID: ${id}`);
    }

    categoryModel.delete(id, transferToCategoryId);
    res.json({
      success: true,
      message: transferToCategoryId
        ? 'Đã chuyển giao dịch và xóa danh mục thành công'
        : 'Đã xóa danh mục thành công'
    });
  })
};

module.exports = categoryController;

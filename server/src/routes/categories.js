/**
 * src/routes/categories.js
 * Định tuyến các thao tác CRUD danh mục thu / chi
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { validateCreateCategory } = require('../middleware/validator');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', validateCreateCategory, categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;

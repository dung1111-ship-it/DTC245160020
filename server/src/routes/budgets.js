/**
 * src/routes/budgets.js
 * Định tuyến các thao tác quản lý ngân sách và kiểm tra tiến độ, cảnh báo
 */

const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { validateSetBudget } = require('../middleware/validator');

router.get('/', budgetController.getBudgets);
router.get('/progress', budgetController.getBudgetProgress);
router.get('/alerts', budgetController.getAlerts);
router.get('/:id', budgetController.getBudgetById);
router.post('/', validateSetBudget, budgetController.setBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;

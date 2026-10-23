/**
 * src/routes/transactions.js
 * Định tuyến các thao tác CRUD và tìm kiếm, phân trang giao dịch
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { validateCreateTransaction } = require('../middleware/validator');

router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.post('/', validateCreateTransaction, transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;

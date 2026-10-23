/**
 * src/routes/wallets.js
 * Định tuyến các thao tác quản lý ví tài khoản thanh toán
 */

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/', walletController.getWallets);
router.get('/:id', walletController.getWalletById);
router.post('/', walletController.createWallet);
router.put('/:id', walletController.updateWallet);
router.delete('/:id', walletController.deleteWallet);

module.exports = router;

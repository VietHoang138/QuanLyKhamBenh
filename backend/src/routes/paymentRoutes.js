const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// All payment routes require authentication
router.use(authenticateToken);

// 1. Get payment list for patient (my-payments)
router.get('/my-payments', authorizeRoles('patient'), paymentController.getMyPayments);

// 2. Pay invoice online (patient only)
router.post('/:id/pay', authorizeRoles('patient'), paymentController.payOnline);

// 3. Get all payments list (doctor only)
router.get('/', authorizeRoles('doctor'), paymentController.getPayments);

// 4. Get revenue statistics (doctor only)
router.get('/stats/revenue', authorizeRoles('doctor'), paymentController.getRevenueStatistics);

// 5. Confirm cash payment (doctor only)
router.post('/:id/confirm-cash', authorizeRoles('doctor'), paymentController.confirmCashPayment);

// 6. Get payment detail (authenticated users: patient of the bill or doctor)
router.get('/:id', paymentController.getPaymentDetail);

module.exports = router;

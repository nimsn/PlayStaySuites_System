const express = require('express');
const router = express.Router();
const billingCtrl = require('../controllers/billingController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); 

const billingAccess = [authenticateToken, authorizeRoles('Admin', 'Staff')];

router.get('/invoices/eligible-bookings', billingAccess, billingCtrl.getEligibleBookings);
router.get('/invoices', billingAccess, billingCtrl.getInvoices);
router.get('/invoices/:id', billingAccess, billingCtrl.getInvoice);
router.post('/invoices', billingAccess, billingCtrl.addInvoice);
router.put('/invoices/:id', billingAccess, billingCtrl.updateInvoice);
router.delete('/invoices/:id', billingAccess, billingCtrl.removeInvoice);

router.post('/payments', billingAccess, billingCtrl.addPayment);

router.get('/reports/reconciliation', billingAccess, billingCtrl.getReconciliationReport);

module.exports = router;
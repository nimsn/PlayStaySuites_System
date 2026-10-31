const express = require('express');
const router = express.Router();
const billingCtrl = require('../controllers/billingController');


router.get('/invoices', billingCtrl.getInvoices);
router.post('/invoices', billingCtrl.addInvoice);

router.post('/payments', billingCtrl.addPayment);

router.get('/reports/reconciliation', billingCtrl.getReconciliationReport);

module.exports = router;
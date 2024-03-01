const router = require('express').Router();
const ctrl = require('../controllers/companyController');


// GET: /api/company
router.route('/api/company').get(ctrl.getCompany);
// DELETE: /api/company/:id/:param (param = 0 or 1)
router.route('/api/company/:id').delete(ctrl.deleteCompany);
router.route('/api/company/:id/:param').delete(ctrl.deleteCompany);
// POST: /api/order
router.route('/api/order').post(ctrl.addCompanyAndOrders);
// PUT: /api/order/:id
router.route('/api/order/:id').put(ctrl.updateOrder);

module.exports = router;
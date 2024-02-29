const express = require('express');
const router = express.Router();
const app = express();

const ctrl = require('../controllers/companyController');


// GET: /api/company
router.route('/api/company').get(ctrl.getCompany);
// DELETE: /api/company/:id/:param (param = 0 or 1)
router.route('/api/company/:id/:param').delete(ctrl.deleteCompany);
// POST: /api/company/order
router.route('/api/order').post(ctrl.addCompanyAndOrders);

module.exports = router;
const express = require('express');
const router = express.Router();
const app = express();

const ctrl = require('../controllers/companyController');


// GET: /api/company
router.route('/api/company').get(ctrl.getCompany);
// DELETE: /api/company/:id
router.route('/api/company/:id').delete(ctrl.deleteCompany);


module.exports = router;
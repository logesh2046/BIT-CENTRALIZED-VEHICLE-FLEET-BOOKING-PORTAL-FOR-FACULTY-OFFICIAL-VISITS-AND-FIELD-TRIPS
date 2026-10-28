const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', authorize('ADMIN', 'TRANSPORT_OFFICER'), getReports);

module.exports = router;

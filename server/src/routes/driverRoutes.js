const express = require('express');
const router = express.Router();
const { getDrivers, getDriver, createDriver, updateDriver, checkDriverAvailability } = require('../controllers/driverController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/availability', checkDriverAvailability);
router.get('/', getDrivers);
router.get('/:id', getDriver);
router.post('/', authorize('ADMIN', 'TRANSPORT_OFFICER'), createDriver);
router.put('/:id', authorize('ADMIN', 'TRANSPORT_OFFICER'), updateDriver);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getVehicles, getVehicle, createVehicle, updateVehicle, checkAvailability } = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/availability', checkAvailability);
router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', authorize('ADMIN', 'TRANSPORT_OFFICER'), createVehicle);
router.put('/:id', authorize('ADMIN', 'TRANSPORT_OFFICER'), updateVehicle);

module.exports = router;

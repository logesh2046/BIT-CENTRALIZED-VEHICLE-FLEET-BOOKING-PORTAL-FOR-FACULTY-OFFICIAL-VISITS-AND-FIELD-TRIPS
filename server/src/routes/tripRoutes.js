const express = require('express');
const router = express.Router();
const { getTrips, updateTripStatus } = require('../controllers/tripController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getTrips);
router.put('/:id/status', updateTripStatus);

module.exports = router;

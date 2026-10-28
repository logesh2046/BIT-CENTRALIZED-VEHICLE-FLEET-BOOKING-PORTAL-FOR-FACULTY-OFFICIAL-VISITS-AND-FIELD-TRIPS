const express = require('express');
const router = express.Router();
const {
  getBookings, getBooking, createBooking, updateBooking,
  approveBooking, rejectBooking, cancelBooking, getRouteInfo,
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route-info view (for email links, drivers, and faculty)
router.get('/:id/route-info', getRouteInfo);

router.use(authenticate);

router.get('/', getBookings);
router.get('/:id', getBooking);
router.post('/', authorize('FACULTY'), createBooking);
router.put('/:id', authorize('FACULTY', 'ADMIN'), updateBooking);
router.post('/:id/approve', authorize('HOD'), approveBooking);
router.post('/:id/reject', authorize('HOD'), rejectBooking);
router.post('/:id/cancel', authorize('FACULTY', 'ADMIN'), cancelBooking);

module.exports = router;

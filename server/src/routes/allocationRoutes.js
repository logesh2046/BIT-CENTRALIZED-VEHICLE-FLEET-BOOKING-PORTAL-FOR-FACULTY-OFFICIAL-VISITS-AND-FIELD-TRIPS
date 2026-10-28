const express = require('express');
const router = express.Router();
const { createAllocation, getAllocations, updateAllocation, getEmailLogs, sendTestEmail } = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('TRANSPORT_OFFICER', 'ADMIN'));

router.get('/email-logs', getEmailLogs);
router.post('/test-email', sendTestEmail);
router.get('/', getAllocations);
router.post('/', createAllocation);
router.put('/:id', updateAllocation);

module.exports = router;

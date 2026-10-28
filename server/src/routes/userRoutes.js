const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, resetPassword, getDepartments } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/departments', getDepartments);
router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', authorize('ADMIN'), getUser);
router.post('/', authorize('ADMIN'), createUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.put('/:id/reset-password', authorize('ADMIN'), resetPassword);

module.exports = router;

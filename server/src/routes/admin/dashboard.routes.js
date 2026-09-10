const { Router } = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const { getDashboardStats } = require('../../controllers/dashboard.controller');

const router = Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);

module.exports = router;

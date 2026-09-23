/**
 * Analytics routes.
 */
const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const VerifyToken = require('../middlewares/verifyToken');
const checkPermission = require('../middlewares/checkPermission');

const router = express.Router();

router.get(
    '/dashboard',
    VerifyToken,
    checkPermission('view_dashboard'),
    analyticsController.getDashboardAnalytics
);

router.get(
    '/export-database',
    VerifyToken,
    checkPermission('manage_users'),
    analyticsController.exportDatabase
);

module.exports = router;

/**
 * User activity routes.
 *
 * Mounted at the API root so it can expose both `/activities` (self) and
 * `/users/:user_id/activities` (admin).
 *
 * NOTE: authentication is applied per-route (not via a blanket `router.use`)
 * so unmatched paths still fall through to the 404 handler.
 */
const express = require('express');
const userActivityController = require('../controllers/userActivityController');
const VerifyToken = require('../middlewares/verifyToken');
const checkPermission = require('../middlewares/checkPermission');

const router = express.Router();

// Self-service: the authenticated user's own activities.
router.get('/activities', VerifyToken, userActivityController.getMyActivities);

// Admin: another user's activities & activity deletion.
router.get(
    '/users/:user_id/activities',
    VerifyToken,
    checkPermission('manage_users'),
    userActivityController.getUserActivities
);
router.delete(
    '/activities/:id',
    VerifyToken,
    checkPermission('manage_users'),
    userActivityController.deleteActivity
);

module.exports = router;

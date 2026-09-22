/**
 * Application settings routes.
 *
 * `GET` requires authentication; `PUT` additionally requires a management
 * permission because it mutates global settings.
 */
const express = require('express');
const appSettingController = require('../controllers/appSettingController');
const VerifyToken = require('../middlewares/verifyToken');
const checkPermission = require('../middlewares/checkPermission');

const router = express.Router();

router.get('/settings', VerifyToken, appSettingController.getSettings);
router.put(
    '/settings',
    VerifyToken,
    checkPermission('manage_users'),
    appSettingController.updateSettings
);

module.exports = router;

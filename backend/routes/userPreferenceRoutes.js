/**
 * Per-user preference routes (theme & language).
 *
 * Both endpoints only require authentication — a user reads and edits their
 * own preferences, so no management permission is needed.
 */
const express = require('express');
const userPreferenceController = require('../controllers/userPreferenceController');
const VerifyToken = require('../middlewares/verifyToken');

const router = express.Router();

router.get('/preferences', VerifyToken, userPreferenceController.getPreferences);
router.put('/preferences', VerifyToken, userPreferenceController.updatePreferences);

module.exports = router;

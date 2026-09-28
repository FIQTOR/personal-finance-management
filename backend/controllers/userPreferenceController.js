const UserPreference = require('../models/userPreference');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// Allowed values for the per-user preference fields.
const ALLOWED_THEMES = ['light', 'dark'];
const ALLOWED_LANGUAGES = ['en', 'id', 'zh', 'ar', 'hi'];

const DEFAULT_PREFERENCES = { theme: 'light', language: 'en' };

/**
 * Serialise a preference row into the client-facing shape.
 */
const toPreferenceData = (preference) => ({
  theme: preference.theme,
  language: preference.language,
});

/**
 * Load the current user's preferences, creating the default row when absent.
 * @param {number} userId
 */
const findOrCreatePreferences = async (userId) => {
  const [preference] = await UserPreference.findOrCreate({
    where: { user_id: userId },
    defaults: { ...DEFAULT_PREFERENCES, user_id: userId },
  });
  return preference;
};

/**
 * GET /preferences
 * Return the authenticated user's theme & language (defaults created on demand).
 */
exports.getPreferences = asyncHandler(async (req, res) => {
  const preference = await findOrCreatePreferences(req.user.id);
  return success(res, {
    message: 'Preferences retrieved successfully',
    data: toPreferenceData(preference),
  });
});

/**
 * PUT /preferences
 * Upsert the authenticated user's theme & language. Users edit their own
 * preferences, so no management permission is required.
 */
exports.updatePreferences = asyncHandler(async (req, res) => {
  const { theme, language } = req.body || {};

  if (theme === undefined && language === undefined) {
    throw new AppError('No preferences provided', 400, { code: 'MISSING_FIELDS' });
  }

  if (theme !== undefined && !ALLOWED_THEMES.includes(theme)) {
    throw new AppError('Invalid theme value', 400, { code: 'INVALID_THEME' });
  }

  if (language !== undefined && !ALLOWED_LANGUAGES.includes(language)) {
    throw new AppError('Invalid language value', 400, { code: 'INVALID_LANGUAGE' });
  }

  const preference = await findOrCreatePreferences(req.user.id);

  if (theme !== undefined) preference.theme = theme;
  if (language !== undefined) preference.language = language;
  await preference.save();

  return success(res, {
    message: 'Preferences updated successfully',
    data: toPreferenceData(preference),
  });
});

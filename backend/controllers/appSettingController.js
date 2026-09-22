const AppSetting = require('../models/appSetting');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

// Only these setting keys may be written by clients (allow-list).
const ALLOWED_SETTING_KEYS = ['default_currency', 'default_language'];

const toMap = (settings) => {
  const map = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  return map;
};

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await AppSetting.findAll();
  return success(res, { message: 'Settings retrieved successfully', data: toMap(settings) });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settingsData = req.body || {};

  for (const [key, value] of Object.entries(settingsData)) {
    if (ALLOWED_SETTING_KEYS.includes(key)) {
      await AppSetting.upsert({ key, value: String(value) });
    }
  }

  const updatedSettings = await AppSetting.findAll();
  return success(res, { message: 'Settings updated successfully', data: toMap(updatedSettings) });
});

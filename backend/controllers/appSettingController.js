const AppSetting = require('../models/appSetting');

exports.getSettings = async (req, res) => {
  try {
    const settings = await AppSetting.findAll();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.status(200).json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settingsData = req.body; // e.g. { default_language: 'id', default_currency: 'IDR' }
    for (const [key, value] of Object.entries(settingsData)) {
      if (typeof key === 'string' && key.trim()) {
        await AppSetting.upsert({ key, value: String(value) });
      }
    }

    const updatedSettings = await AppSetting.findAll();
    const settingsMap = {};
    updatedSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsMap
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

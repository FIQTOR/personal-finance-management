/**
 * API Routes Configuration
 *
 * All routes are mounted under '/api'. Each domain lives in its own file under
 * this folder to keep route definitions small and reviewable.
 */
const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const activityRoutes = require('./activityRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const financeRoutes = require('./financeRoutes');
const appSettingRoutes = require('./appSettingRoutes');

const apiRouter = express.Router();

// Health / root endpoint.
apiRouter.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello from the API v1!',
        data: null,
    });
});

apiRouter.use('/', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/permissions', permissionRoutes);
apiRouter.use('/', activityRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/', appSettingRoutes);
apiRouter.use('/', financeRoutes);

module.exports = apiRouter;

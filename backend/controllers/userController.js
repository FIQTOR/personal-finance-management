// User management controller.
const { PassThrough } = require('stream');
const multer = require('multer');
const { google } = require('googleapis');
const { Op } = require('sequelize');
const User = require('../models/user');
const Role = require('../models/role');
const Permission = require('../models/permission');
const RolePermission = require('../models/rolePermission');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { hashPassword } = require('../utils/password');
const activityService = require('../services/activityService');

// --- Google Drive integration (avatar uploads) --------------------------------

const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: env.GOOGLE_CLIENT_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) return cb(null, true);
        return cb(new Error('Only image files are allowed!'));
    },
});

const uploadToDrive = async (fileObject) => {
    const bufferStream = new PassThrough();
    bufferStream.end(fileObject.buffer);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 12);
    const fileExtension = fileObject.originalname.split('.').pop();
    const randomFileName = `avatar_${timestamp}_${randomString}.${fileExtension}`;

    const response = await drive.files.create({
        requestBody: {
            name: randomFileName,
            parents: [env.GOOGLE_DRIVE_ID_USER],
            mimeType: fileObject.mimetype,
        },
        media: { mimeType: fileObject.mimetype, body: bufferStream },
        fields: 'id',
        supportsAllDrives: true,
    });

    const fileId = response.data.id;
    await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
    });

    return `https://lh3.googleusercontent.com/d/${fileId}`;
};

const deleteFromDrive = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes('/d/')) return;
        const fileId = fileUrl.split('/d/')[1];
        try {
            await drive.files.get({ fileId, fields: 'id' });
            await drive.files.delete({ fileId });
        } catch (err) {
            if (err.code === 404) return; // already gone
            throw err;
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in deleteFromDrive:', error.message);
    }
};

/** Safely remove an avatar that lives in Google Drive. */
const maybeDeleteAvatar = async (avatarUrl) => {
    if (avatarUrl && avatarUrl.includes('googleusercontent')) {
        await deleteFromDrive(avatarUrl);
    }
};

// --- Controllers --------------------------------------------------------------

/**
 * List users with pagination, search, role filter and sorting.
 */
const getUsers = asyncHandler(async (req, res) => {
    const {
        search,
        role,
        orderBy = 'created_at',
        order = 'DESC',
        limit = 10,
        page = 1,
    } = req.query;

    const orderDirection = String(order).toUpperCase();
    if (!['ASC', 'DESC'].includes(orderDirection)) {
        throw new AppError("Order must be either 'ASC' or 'DESC'", 400, { code: 'INVALID_ORDER' });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = search
        ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ],
        }
        : {};

    const includeClause = [
        {
            model: Role,
            as: 'role',
            ...(role && { where: { name: role } }),
            include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
        },
        {
            model: User,
            as: 'updater',
            attributes: ['id', 'name', 'email', 'avatar_url'],
            required: false,
        },
        {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email', 'avatar_url'],
            required: false,
        },
    ];

    const total = await User.count({ where: whereClause, include: role ? includeClause : undefined });

    const users = await User.findAll({
        where: whereClause,
        include: includeClause,
        order: [[orderBy, orderDirection]],
        limit: Number(limit),
        offset,
    });

    return success(res, {
        message: 'Users retrieved successfully',
        data: { users, total },
    });
});

/**
 * Get a single user by id (with role & permissions).
 */
const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findOne({
        where: { id },
        include: {
            association: 'role',
            include: [{ association: 'permissions', through: RolePermission }],
        },
    });

    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    return success(res, { message: 'User retrieved successfully', data: { user } });
});

/**
 * Create a new user (admin action).
 */
const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, isBlocked, isVerified, roleId } = req.body;

    if (!name || !email || !password || roleId === undefined) {
        throw new AppError(
            'Name, email, password and role id are required',
            400,
            { code: 'MISSING_FIELDS' }
        );
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('Email already exists', 400, { code: 'EMAIL_EXISTS' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
        throw new AppError('Role not found', 400, { code: 'ROLE_NOT_FOUND' });
    }

    const user = await User.create({
        name,
        email,
        role_id: role.id,
        is_verified: isVerified === true || isVerified === 'true',
        password: await hashPassword(password),
        created_by: req.user.id,
    });

    if (isBlocked === true || isBlocked === 'true') {
        await user.update({ is_blocked: true, blocked_at: new Date() });
    }

    if (req.file) {
        try {
            await user.update({ avatar_url: await uploadToDrive(req.file) });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error uploading avatar:', error);
        }
    }

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'created_user',
        description: `Created user: ${user.name}`,
        isGeneral: false,
    });

    return success(res, { statusCode: 201, message: 'Successfully created new user', data: user });
});

/**
 * Update a user (admin action).
 */
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, roleId, is_blocked, is_verified } = req.body;

    if (!name || !email || roleId === undefined) {
        throw new AppError('Name, email and role are required', 400, { code: 'MISSING_FIELDS' });
    }

    const user = await User.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
        throw new AppError('Role not found', 400, { code: 'ROLE_NOT_FOUND' });
    }

    const toBool = (v) => v === true || v === 'true';

    const updateData = {
        name,
        email,
        role_id: role.id,
        is_verified: toBool(is_verified),
        updated_by: req.user.id,
    };

    if (user.is_blocked !== toBool(is_blocked)) {
        updateData.is_blocked = toBool(is_blocked);
        updateData.blocked_at = toBool(is_blocked) ? new Date() : null;
    }

    if (req.file) {
        try {
            await maybeDeleteAvatar(user.avatar_url);
            updateData.avatar_url = await uploadToDrive(req.file);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error updating avatar:', error);
        }
    }

    await user.update(updateData);

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'updated_user',
        description: `Updated user: ${user.name}`,
        isGeneral: false,
    });

    return success(res, { message: 'Successfully updated user', data: user });
});

/**
 * Delete a single user.
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'deleted_user',
        description: `Deleted user: ${user.name}`,
        isGeneral: false,
    });

    await maybeDeleteAvatar(user.avatar_url);
    await user.destroy();

    return success(res, { message: 'Successfully deleted user' });
});

/**
 * Bulk delete users.
 */
const bulkDeleteUsers = asyncHandler(async (req, res) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('User IDs array is required and cannot be empty', 400, { code: 'MISSING_FIELDS' });
    }

    if (userIds.includes(1)) {
        throw new AppError('Cannot delete the primary admin user (ID: 1)', 400, { code: 'PROTECTED_USER' });
    }

    const users = await User.findAll({ where: { id: userIds } });
    if (users.length === 0) {
        throw new AppError('No users found with the provided IDs', 404, { code: 'USER_NOT_FOUND' });
    }

    for (const user of users) {
        await maybeDeleteAvatar(user.avatar_url);
    }

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'bulk_deleted_users',
        description: `Bulk deleted ${users.length} users: ${users.map((u) => u.name).join(', ')}`,
        isGeneral: false,
    });

    await User.destroy({ where: { id: userIds } });

    return success(res, {
        message: `Successfully deleted ${users.length} users`,
        data: { deletedCount: users.length },
    });
});

/**
 * Update the authenticated user's own profile (name).
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new AppError('Name is required', 400, { code: 'MISSING_FIELDS' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    const existingUser = await User.findOne({
        where: { name, id: { [Op.ne]: user.id } },
    });
    if (existingUser) {
        throw new AppError('Username already exists', 400, { code: 'USERNAME_EXISTS' });
    }

    await user.update({ name });

    await activityService.logActivity(req, {
        userId: user.id,
        activityType: 'profile_update',
        description: 'Updated profile name',
    });

    return success(res, {
        message: 'Successfully updated profile',
        data: { user: { name: user.name } },
    });
});

/**
 * Update the authenticated user's avatar.
 */
const updateProfileAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('No avatar file provided', 400, { code: 'MISSING_FILE' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    await maybeDeleteAvatar(user.avatar_url);
    const avatarUrl = await uploadToDrive(req.file);
    await user.update({ avatar_url: avatarUrl });

    await activityService.logActivity(req, {
        userId: user.id,
        activityType: 'profile_update',
        description: 'Updated profile avatar',
    });

    return success(res, {
        message: 'Successfully updated profile avatar',
        data: { user: { avatar_url: user.avatar_url } },
    });
});

/**
 * Reset another user's password (admin action).
 */
const resetUserPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new AppError('Password is required', 400, { code: 'MISSING_FIELDS' });
    }

    const user = await User.findByPk(id);
    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    await user.update({
        password: await hashPassword(password),
        last_password_change: new Date(),
        updated_by: req.user.id,
    });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'reset_password',
        description: `Reset password for user: ${user.name}`,
        isGeneral: false,
    });

    return success(res, { message: 'Successfully reset user password' });
});

module.exports = {
    upload,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    updateProfile,
    updateProfileAvatar,
    resetUserPassword,
};

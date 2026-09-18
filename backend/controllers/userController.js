// Import required dependencies
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Role = require("../models/role");
const Permission = require("../models/permission");
const multer = require('multer');
const { Op } = require("sequelize");
const RolePermission = require("../models/rolePermission");
const UserActivity = require("../models/userActivity");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
});

const drive = google.drive({
    version: "v3",
    auth: oauth2Client,
});

// Replace multer storage configuration
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Add these helper functions before the controller functions
const uploadToDrive = async (fileObject) => {
    try {
        const bufferStream = new require('stream').PassThrough();
        bufferStream.end(fileObject.buffer);

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 12);
        const fileExtension = fileObject.originalname.split('.').pop();
        const randomFileName = `avatar_${timestamp}_${randomString}.${fileExtension}`;

        const response = await drive.files.create({
            requestBody: {
                name: randomFileName,
                parents: [process.env.GOOGLE_DRIVE_ID_USER],
                'mimeType': fileObject.mimetype
            },
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream
            },
            fields: 'id',
            supportsAllDrives: true,
        });

        const fileId = response.data.id;

        // Set public permission
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        return `https://lh3.googleusercontent.com/d/${fileId}`;
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw new Error('Failed to upload file to Google Drive');
    }
};

const deleteFromDrive = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes('/d/')) {
            console.log('Invalid file URL format:', fileUrl);
            return;
        }

        const fileId = fileUrl.split('/d/')[1];

        // Check if file exists before attempting to delete
        try {
            await drive.files.get({
                fileId: fileId,
                fields: 'id'
            });

            // If file exists, delete it
            await drive.files.delete({
                fileId: fileId
            });
        } catch (err) {
            // If file not found, just log and continue
            if (err.code === 404) {
                console.log(`File ${fileId} already deleted or not found`);
                return;
            }
            throw err; // Re-throw other errors
        }
    } catch (error) {
        console.error('Error in deleteFromDrive:', error.message);
        // Don't throw error to prevent breaking the main flow
    }
};

/**
 * Get all users without pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{
                model: Role,
                as: 'role',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            }, {
                model: User,
                as: 'updater',
                attributes: ['id', 'name', 'email', 'avatar_url'],
                required: false
            }, {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'email', 'avatar_url'],
                required: false
            }],
            order: [['created_at', 'DESC']],
            where: {
                deleted_at: null // Only get non-deleted users
            }
        });

        res.status(200).json({
            status: "success",
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'failed',
            message: 'Internal server error'
        });
    }
};


/**
 * Retrieve all users from the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsers = async (req, res) => {
    try {
        const {
            search,
            role,
            orderBy = 'created_at',
            order = 'DESC',
            limit = 10,
            page = 1
        } = req.query;

        // Validate order direction
        if (!['ASC', 'DESC'].includes(order.toUpperCase())) {
            return res.status(400).json({
                status: "failed",
                message: "Order must be either 'ASC' or 'DESC'"
            });
        }

        // Calculate offset for pagination
        const offset = (Number(page) - 1) * Number(limit);

        // Build where clause for search
        let whereClause = {};

        if (search) {
            whereClause = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                ]
            };
        }

        const includeClause = [
            {
                model: Role,
                as: 'role',
                ...(role && { where: { name: role } }),
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            },
            {
                model: User,
                as: 'updater',
                attributes: ['id', 'name', 'email', 'avatar_url'],
                required: false
            }, {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'email', 'avatar_url'],
                required: false
            },];

        // Get total count for pagination
        const total = await User.count({
            where: whereClause,
            include: role ? includeClause : undefined
        });

        // Find users with pagination and eager load associations
        const users = await User.findAll({
            where: whereClause,
            include: includeClause,
            order: [[orderBy, order.toUpperCase()]],
            limit: Number(limit),
            offset: offset
        });

        // Send response
        res.status(200).json({
            status: "success",
            data: {
                users,
                total
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * Retrieve a single user by ID with associated role and permissions
 * @param {Object} req - Express request object containing user ID
 * @param {Object} res - Express response object
 */
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Find user by ID
        const user = await User.findOne({
            where: { id },
            include: {
                association: 'role',
                include: [{
                    association: 'permissions',
                    through: RolePermission
                }]
            }
        });

        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: 'User not found'
            });
        }
        // Format the response
        const formattedUser = {
            ...user.toJSON(),
        };

        res.status(200).json({
            status: "success",
            user: formattedUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * Create a new user with encrypted password and assigned role
 * @param {Object} req - Express request object containing user details
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {

    try {

        const { name, email, password, isBlocked, isVerified, roleId } = req.body;
        // Validate required fields
        if (!name || !email || !password || !isBlocked || !isVerified || !roleId) {
            return res.status(400).json({ status: "failed", message: "Name, email, password, is blocked, is verified, and role id are required" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: "failed",
                message: "Email already exists"
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Find and assign role to user
        const role = await Role.findByPk(roleId);

        if (!role) {
            return res.status(400).json({ status: "failed", message: 'Role not found' });
        }

        // Create new user with hashed password
        const user = await User.create({ name, email, role_id: role.id, is_verified: isVerified, password: hash, created_by: req.user.id });

        if (isBlocked === true) {
            await user.update({ is_blocked: true, blocked_at: new Date() });
        }

        if (req.file) {
            try {
                const avatarUrl = await uploadToDrive(req.file);
                await user.update({ avatar_url: avatarUrl });
            } catch (error) {
                console.error('Error uploading avatar:', error);
            }
        }

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'created_user',
            status: 'info',
            description: `Created user: ${user.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(201).json({
            status: "success",
            message: "Successfully created new user",
            data: user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * Update user information including avatar and role
 * @param {Object} req - Express request object containing updated user details
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, roleId, is_blocked, is_verified } = req.body;

        // Validate required fields
        if (!name || !email || !roleId || !is_blocked || !is_verified) {
            return res.status(400).json({ status: "failed", message: "Name, email, is blocked, and is verified, and Role are required" });
        }

        // Check if user exists
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ status: "failed", message: 'User not found' });
        }

        // Find role by ID
        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(400).json({ message: 'Role not found' });
        }

        const userUpdater = await User.findByPk(req.user.id);

        // Create update object
        const updateData = {
            name,
            email,
            role_id: role.id,
            is_verified: is_verified === 'true',
            updated_by: userUpdater.id
        };

        // Only update blocked status if it's different from current status
        if (user.is_blocked !== (is_blocked === 'true')) {
            updateData.is_blocked = is_blocked === 'true';
            updateData.blocked_at = is_blocked === 'true' ? new Date() : null;
        }

        if (req.file) {
            try {
                // Delete old avatar if exists
                if (user.avatar_url) {
                    if (user.avatar_url.includes('googleusercontent')) {
                        await deleteFromDrive(user.avatar_url);
                    }
                }
                const avatarUrl = await uploadToDrive(req.file);
                updateData.avatar_url = avatarUrl;
            } catch (error) {
                console.error('Error updating avatar:', error);
            }
        }

        await user.update(updateData);

        // Log activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'updated_user',
            status: 'info',
            description: `Updated user: ${user.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({
            status: "success",
            message: "Successfully updated user",
            data: user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * Delete a user from the database
 * @param {Object} req - Express request object containing user ID
 * @param {Object} res - Express response object
 */
const deleteUser = async (req, res) => {


    try {

        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ status: "failed", message: 'User not found' });
        }
        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'deleted_user',
            status: 'info',
            description: `Deleted user: ${user.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        if (user.avatar_url && user.avatar_url.includes('googleusercontent')) {
            try {
                await deleteFromDrive(user.avatar_url);
            } catch (err) {
                console.error('Error deleting avatar:', err);
            }
        }

        await user.destroy();
        res.status(200).json({
            status: "success",
            message: "Successfully deleted user",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * Delete multiple users from the database
 * @param {Object} req - Express request object containing array of user IDs
 * @param {Object} res - Express response object
 */
const bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                status: "failed",
                message: "User IDs array is required and cannot be empty"
            });
        }

        // Prevent deletion of user ID 1 (admin/superuser)
        if (userIds.includes(1)) {
            return res.status(400).json({
                status: "failed",
                message: "Cannot delete the primary admin user (ID: 1)"
            });
        }

        // Find users to delete
        const users = await User.findAll({
            where: {
                id: userIds
            }
        });

        if (users.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No users found with the provided IDs"
            });
        }

        // Delete avatar files from Google Drive
        for (const user of users) {
            if (user.avatar_url && user.avatar_url.includes('googleusercontent')) {
                try {
                    await deleteFromDrive(user.avatar_url);
                } catch (err) {
                    console.error('Error deleting avatar for user', user.id, ':', err);
                }
            }
        }

        // Log bulk delete activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'bulk_deleted_users',
            status: 'info',
            description: `Bulk deleted ${users.length} users: ${users.map(u => u.name).join(', ')}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        // Delete users
        await User.destroy({
            where: {
                id: userIds
            }
        });

        res.status(200).json({
            status: "success",
            message: `Successfully deleted ${users.length} users`,
            deletedCount: users.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * Update user's name and avatar
 * @param {Object} req - Express request object containing updated user details
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {


    try {
        const { name } = req.body;

        // Validate required field
        if (!name) {
            return res.status(400).json({ status: "failed", message: "Name is required" });
        }


        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ status: "failed", message: 'User not found' });
        }

        // Check if name already exists for other users
        const existingUser = await User.findOne({
            where: {
                name: name,
                id: { [Op.ne]: user.id } // Exclude current user
            }
        });

        if (existingUser) {
            return res.status(400).json({
                status: "failed",
                message: 'Username already exists'
            });
        }

        await user.update({ name });

        // Log activity for profile update without avatar
        await UserActivity.create({
            user_id: user.id,
            activity_type: 'profile_update',
            status: 'info',
            description: 'Updated profile name',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({
            status: "success",
            message: "Successfully updated profile",
            user: {
                name: user.name,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

const updateProfileAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "failed",
                message: "No avatar file provided"
            });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ status: "failed", message: 'User not found' });
        }

        // Delete old avatar if exists
        if (user.avatar_url) {
            if (user.avatar_url.includes('googleusercontent')) {
                await deleteFromDrive(user.avatar_url);
            }
        }

        const avatarUrl = await uploadToDrive(req.file);

        await user.update({ avatar_url: avatarUrl });

        // Log activity for profile update with avatar
        await UserActivity.create({
            user_id: user.id,
            activity_type: 'profile_update',
            description: `Updated profile avatar`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });


        res.status(200).json({
            status: "success",
            message: "Successfully updated profile avatar",
            user: {
                avatar_url: user.avatar_url
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
}

const resetUserPassword = async (req, res) => {


    try {

        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                status: "failed",
                message: "Password is required"
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: 'User not found'
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await user.update({
            password: hash,
            last_password_change: new Date(),
            updated_by: req.user.id
        });

        // Log activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'reset_password',
            status: 'info',
            description: `Reset password for user: ${user.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({
            status: "success",
            message: "Successfully reset user password"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'failed',
            message: 'Internal server error'
        });
    }
};

// Export controller functions and upload middleware
module.exports = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    updateProfile,
    updateProfileAvatar,
    deleteUser,
    bulkDeleteUsers,
    resetUserPassword,
    getAllUsers,
    upload
};

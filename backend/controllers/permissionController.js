// Import required model
const Permission = require('../models/permission');
const { Op } = require('sequelize');
const RolePermission = require('../models/rolePermission');
const UserSession = require('../models/userSession');
const User = require('../models/user');
const UserActivity = require('../models/userActivity');

/**
 * Get all permissions with pagination, sorting, and search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing all permissions
 * @description Retrieves all permissions from the database with filtering options
 */
const getPermissions = async (req, res) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10,
            orderBy = 'created_at', // Changed from createdAt
            order = 'DESC'
        } = req.query;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build where clause for search
        const whereClause = search
            ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ]
            }
            : {};

        // Get total count for pagination
        const total = await Permission.count({ where: whereClause });

        // Find permissions with pagination and sorting
        const permissions = await Permission.findAll({
            where: whereClause,
            order: [[orderBy, order]],
            limit: parseInt(limit),
            offset: offset
        });

        // Process permissions to include creator and updater information
        for (const permission of permissions) {
            if (permission.created_by) {
                const creator = await User.findByPk(permission.created_by, {
                    attributes: ['name']
                });
                permission.dataValues.creator = creator;
            }

            if (permission.updated_by) {
                const updater = await User.findByPk(permission.updated_by, {
                    attributes: ['name']
                });
                permission.dataValues.updater = updater;
            }
        }

        res.status(200).json({
            status: 'success',
            data: permissions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Get a permission by ID
 * @param {Object} req - Express request object containing permission ID in params
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the permission details
 * @description Retrieves a specific permission by its ID
 */
const getPermission = async (req, res) => {
    try {
        // Extract permission ID from params
        const { id } = req.params;

        // Find the permission
        const permission = await Permission.findByPk(id);

        if (!permission) {
            return res.status(404).json({
                status: 'error',
                message: 'Permission not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: permission
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Create a new permission
 * @param {Object} req - Express request object containing permission details in body
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the created permission
 * @description Creates a new permission
 */
const createPermission = async (req, res) => {
    try {
        // Extract permission details from request body
        const { name, description } = req.body;

        const check = await Permission.findOne({ where: { name: name } })

        if (check) {
            return res.status(400).json({
                status: 'error',
                message: `Permission with name '${name}' already exists`
            });
        }

        // Create new permission
        const permission = await Permission.create({
            name,
            description,
            created_at: new Date(),
            created_by: req.user.id,
            updated_at: new Date()
        });

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'created_permission',
            status: 'info',
            description: `Created permission: ${permission.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(201).json({
            status: 'success',
            message: 'Permission created successfully',
            data: permission
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Update an existing permission
 * @param {Object} req - Express request object containing permission ID in params and update data in body
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the updated permission
 * @description Updates a permission's details
 */
const updatePermission = async (req, res) => {
    try {
        // Extract permission ID and update data
        const { id } = req.params;
        const { name, description } = req.body;

        // Find the permission to update
        const permission = await Permission.findByPk(id);
        if (!permission) {
            return res.status(404).json({ status: 'error', message: 'Permission not found' });
        }

        const check = await Permission.findOne({ where: { name } })
        if (check && check.name !== permission.name) {
            return res.status(400).json({
                status: 'error',
                message: `Permission with name '${name}' already exists`
            });
        }

        // Update permission details
        const updatedPermission = await permission.update({
            name,
            description,
            updated_by: req.user.id,
            updated_at: new Date()
        });

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'updated_permission',
            status: 'info',
            description: `Updated permission: ${permission.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({
            status: 'success',
            message: 'Permission updated successfully',
            data: updatedPermission
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Delete a permission
 * @param {Object} req - Express request object containing permission ID in params
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 * @description Deletes a permission from the database
 */
const deletePermission = async (req, res) => {
    try {
        // Extract permission ID
        const { id } = req.params;

        // Find the permission to delete
        const permission = await Permission.findByPk(id);

        if (!permission) {
            return res.status(404).json({ status: 'error', message: 'Permission not found' });
        }

        // Delete all role-permission associations for this permission
        await RolePermission.destroy({
            where: { permission_id: permission.id }
        });

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'deleted_permission',
            status: 'info',
            description: `Deleted permission: ${permission.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        // Delete the permission
        await permission.destroy();


        res.status(200).json({
            status: 'success',
            message: 'Permission deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Export controller functions
module.exports = {
    getPermissions,
    getPermission,
    createPermission,
    updatePermission,
    deletePermission
};
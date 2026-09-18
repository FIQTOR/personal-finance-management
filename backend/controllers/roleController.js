// Import required models
const Role = require('../models/role');
const Permission = require('../models/permission');
const RolePermission = require('../models/rolePermission');
const { Op } = require('sequelize');
const User = require('../models/user');
const UserSession = require('../models/userSession');
const UserActivity = require('../models/userActivity');

/**
 * Get all roles with their permissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing all roles and their associated permissions
 * @description Retrieves all roles from the database including their associated permissions
 */
const getRoles = async (req, res) => {
    try {
        const {
            search = '',
            page = 1,
            limit = 10,
            orderBy = 'created_at', // Changed from createdAt
            order = 'DESC'
        } = req.query;

        // Calculate offset for pagination
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
        const total = await Role.count({ where: whereClause });

        // Find all roles with pagination and sorting
        const roles = await Role.findAll({
            where: whereClause,
            order: [[orderBy, order]],
            limit: parseInt(limit),
            offset: offset,
            include: [
                {
                    association: 'permissions',
                    through: RolePermission
                }
            ]
        });

        // Process roles to include creator and updater information
        for (const role of roles) {
            if (role.created_by) {
                const creator = await User.findByPk(role.created_by, {
                    attributes: ['name']
                });
                role.dataValues.creator = creator;
            }

            if (role.updated_by) {
                const updater = await User.findByPk(role.updated_by, {
                    attributes: ['name']
                });
                role.dataValues.updater = updater;
            }
        }

        res.status(200).json({
            status: 'success',
            data: roles,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Get a single role by ID with its permissions
 * @param {Object} req - Express request object containing role ID in params
 * @param {Object} res - Express response object
 * @returns {Object} JSON response containing the role and its associated permissions
 * @description Retrieves a specific role from the database including its associated permissions
 */
const getRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the role
        const role = await Role.findOne({
            where: { id: id },
            include: {
                association: 'permissions',
                through: RolePermission
            }
        });

        if (!role) {
            return res.status(404).json({
                status: 'error',
                message: 'Role not found'
            });
        }

        res.status(200).json({
            status: 'success',
            role: role
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

/**
 * Create a new role
 * @param {Object} req - Express request object containing role details in body
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the created role and its permissions
 * @description Creates a new role with specified permissions
 */
const createRole = async (req, res) => {

    try {


        // Extract role details
        const { name, description, permissions } = req.body;
        // Validate request body
        if (!name || !description) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and description are required'
            });
        }

        // Check if role name already exists
        const existingRole = await Role.findOne({ where: { name } });
        if (existingRole) {
            return res.status(400).json({
                status: 'error',
                message: 'Role name already exists'
            });
        }

        // Create new role
        const role = await Role.create({ name, description, created_by: req.user.id });

        // Validate and assign permissions if provided
        if (permissions && Array.isArray(permissions)) {
            // Verify all permissions exist
            const existingPermissions = await Permission.findAll({
                where: { id: permissions }
            });

            if (existingPermissions.length !== permissions.length) {
                await role.destroy(); // Rollback role creation
                return res.status(400).json({
                    status: 'error',
                    message: 'One or more invalid permission IDs provided'
                });
            }

            // Create role-permission associations
            await role.setPermissions(permissions);
        }

        // Fetch the created role with its permissions using association
        const roleWithPermissions = await Role.findByPk(role.id, {
            include: [{
                model: Permission,
                as: 'permissions',
            }]
        });

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'created_role',
            status: 'info',
            description: `Created role: ${role.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(201).json({
            status: 'success',
            message: 'Role created successfully',
            data: roleWithPermissions
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Update an existing role
 * @param {Object} req - Express request object containing role ID in params and update data in body
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the updated role and its permissions
 * @description Updates a role's details and permissions
 */
const updateRole = async (req, res) => {
    try {

        // Extract role ID and update data
        const { id } = req.params;
        const { name, description, permissions } = req.body;

        // Find the role to update with its current permissions
        const role = await Role.findByPk(id);
        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Role not found' });
        }

        // Update role details
        await role.update({ name, description, updated_by: req.user.id });

        // Update permissions if provided
        if (permissions) {
            // Use setPermissions method provided by Sequelize association
            await role.setPermissions(permissions);
        }

        // Fetch updated role with permissions
        const updatedRole = await Role.findOne({
            where: { id: id },
            include: {
                association: 'permissions',
                through: { attributes: [] } // Exclude junction table attributes
            }
        });

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'updated_role',
            status: 'info',
            description: `Updated role: ${role.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({
            status: 'success',
            message: 'Role updated successfully',
            data: updatedRole
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Delete a role
 * @param {Object} req - Express request object containing role ID in params
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 * @description Deletes a role from the database
 */
const deleteRole = async (req, res) => {

    try {


        const { id } = req.params;

        // Find the role to delete
        const role = await Role.findByPk(id);

        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Role not found' });
        }

        // Update all users with this role_id to have role_id = 1 (default role)
        await User.update(
            { role_id: 1 },
            { where: { role_id: id } }
        );

        // Delete all role-permission associations for this role
        await RolePermission.destroy({
            where: { role_id: role.id }
        });

        // Log role creation activity
        await UserActivity.create({
            user_id: req.user.id,
            activity_type: 'deleted_role',
            status: 'info',
            description: `Deleted role: ${role.name}`,
            ip_address: req.ip,
            is_general: false,
            user_agent: req.headers['user-agent']
        });

        // Delete the role
        await role.destroy();


        res.status(200).json({
            status: 'success',
            message: 'Role deleted successfully and associated users updated to default role'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Export controller functions
module.exports = {
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole
};
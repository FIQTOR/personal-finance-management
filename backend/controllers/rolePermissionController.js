// Import required models
const Role = require('../models/role');
const Permission = require('../models/permission');

/**
 * Assign permissions to a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated role and its permissions
 * @description Assigns multiple permissions to a role
 */
const assignPermissionsToRole = async (req, res) => {
    try {
        const { role_id } = req.params;  // Changed from roleId
        const { permission_ids } = req.body;  // Changed from permissionIds

        // Check if role exists
        const role = await Role.findByPk(role_id);
        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Role not found' });
        }

        // Check if all permissions exist
        const permissions = await Permission.findAll({
            where: { id: permission_ids }
        });

        if (permissions.length !== permission_ids.length) {
            return res.status(404).json({ status: 'error', message: 'One or more permissions not found' });
        }

        // Assign permissions to role
        await role.addPermissions(permission_ids);

        // Fetch updated role with permissions
        const updatedRole = await Role.findByPk(role_id, {
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
            }]
        });

        res.status(200).json({
            status: 'success',
            message: 'Permissions assigned successfully',
            data: updatedRole
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Remove permissions from a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated role and its permissions
 * @description Removes multiple permissions from a role
 */
const removePermissionsFromRole = async (req, res) => {
    try {
        const { role_id } = req.params;  // Changed from roleId
        const { permission_ids } = req.body;  // Changed from permissionIds

        // Check if role exists
        const role = await Role.findByPk(role_id);
        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Role not found' });
        }

        // Remove permissions from role
        await role.removePermissions(permission_ids);

        // Fetch updated role with remaining permissions
        const updatedRole = await Role.findByPk(role_id, {
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
            }]
        });

        res.status(200).json({
            status: 'success',
            message: 'Permissions removed successfully',
            data: updatedRole
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Get all permissions for a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with role's permissions
 * @description Retrieves all permissions associated with a specific role
 */
const getRolePermissions = async (req, res) => {
    try {
        const { role_id } = req.params;

        const role = await Role.findByPk(role_id, {
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
            }]
        });

        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Role not found' });
        }

        res.status(200).json({
            status: 'success',
            data: role.permissions
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Export controller functions
module.exports = {
    assignPermissionsToRole,
    removePermissionsFromRole,
    getRolePermissions
};
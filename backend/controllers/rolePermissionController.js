// Role ↔ permission assignment controller.
const Role = require('../models/role');
const Permission = require('../models/permission');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

const roleWithPermissions = (roleId) =>
    Role.findByPk(roleId, {
        include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });

/** Assign permissions to a role. */
const assignPermissionsToRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const { permission_ids } = req.body;

    if (!Array.isArray(permission_ids)) {
        throw new AppError('permission_ids must be an array', 400, { code: 'INVALID_INPUT' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    const permissions = await Permission.findAll({ where: { id: permission_ids } });
    if (permissions.length !== permission_ids.length) {
        throw new AppError('One or more permissions not found', 404, { code: 'PERMISSION_NOT_FOUND' });
    }

    await role.addPermissions(permission_ids);

    return success(res, {
        message: 'Permissions assigned successfully',
        data: await roleWithPermissions(roleId),
    });
});

/** Remove permissions from a role. */
const removePermissionsFromRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;
    const { permission_ids } = req.body;

    if (!Array.isArray(permission_ids)) {
        throw new AppError('permission_ids must be an array', 400, { code: 'INVALID_INPUT' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    await role.removePermissions(permission_ids);

    return success(res, {
        message: 'Permissions removed successfully',
        data: await roleWithPermissions(roleId),
    });
});

/** Get all permissions for a role. */
const getRolePermissions = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    const role = await roleWithPermissions(roleId);
    if (!role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    return success(res, { message: 'Role permissions retrieved successfully', data: role.permissions });
});

module.exports = { assignPermissionsToRole, removePermissionsFromRole, getRolePermissions };

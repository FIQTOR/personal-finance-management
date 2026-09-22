// Role management controller.
const { Op } = require('sequelize');
const Role = require('../models/role');
const Permission = require('../models/permission');
const RolePermission = require('../models/rolePermission');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const activityService = require('../services/activityService');

const DEFAULT_ROLE_ID = 1;

/** List roles with pagination, search and permissions. */
const getRoles = asyncHandler(async (req, res) => {
    const { search = '', page = 1, limit = 10, orderBy = 'created_at', order = 'DESC' } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereClause = search
        ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ],
        }
        : {};

    const total = await Role.count({ where: whereClause });

    const roles = await Role.findAll({
        where: whereClause,
        order: [[orderBy, order]],
        limit: Number(limit),
        offset,
        include: [{
            association: 'permissions',
            through: RolePermission,
        }],
    });

    // Attach creator / updater names.
    for (const role of roles) {
        if (role.created_by) {
            role.dataValues.creator = await User.findByPk(role.created_by, { attributes: ['name'] });
        }
        if (role.updated_by) {
            role.dataValues.updater = await User.findByPk(role.updated_by, { attributes: ['name'] });
        }
    }

    return success(res, {
        message: 'Roles retrieved successfully',
        data: {
            roles,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
        },
    });
});

/** Get a single role with its permissions. */
const getRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const role = await Role.findOne({
        where: { id },
        include: [{ association: 'permissions', through: RolePermission }],
    });

    if (!role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    return success(res, { message: 'Role retrieved successfully', data: { role } });
});

/** Create a new role, optionally assigning permissions. */
const createRole = asyncHandler(async (req, res) => {
    const { name, description, permissions } = req.body;

    if (!name || !description) {
        throw new AppError('Name and description are required', 400, { code: 'MISSING_FIELDS' });
    }

    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
        throw new AppError('Role name already exists', 400, { code: 'ROLE_EXISTS' });
    }

    const role = await Role.create({ name, description, created_by: req.user.id });

    if (permissions && Array.isArray(permissions)) {
        const existingPermissions = await Permission.findAll({ where: { id: permissions } });
        if (existingPermissions.length !== permissions.length) {
            await role.destroy();
            throw new AppError('One or more invalid permission IDs provided', 400, { code: 'INVALID_PERMISSION' });
        }
        await role.setPermissions(permissions);
    }

    const roleWithPermissions = await Role.findByPk(role.id, {
        include: [{ model: Permission, as: 'permissions' }],
    });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'created_role',
        description: `Created role: ${role.name}`,
        isGeneral: false,
    });

    return success(res, {
        statusCode: 201,
        message: 'Role created successfully',
        data: roleWithPermissions,
    });
});

/** Update a role and (optionally) its permissions. */
const updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    await role.update({ name, description, updated_by: req.user.id });

    if (permissions) {
        await role.setPermissions(permissions);
    }

    const updatedRole = await Role.findOne({
        where: { id },
        include: [{ association: 'permissions', through: { attributes: [] } }],
    });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'updated_role',
        description: `Updated role: ${role.name}`,
        isGeneral: false,
    });

    return success(res, { message: 'Role updated successfully', data: updatedRole });
});

/** Delete a role and reassign affected users to the default role. */
const deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (Number(id) === DEFAULT_ROLE_ID) {
        throw new AppError('Cannot delete the default role', 400, { code: 'PROTECTED_ROLE' });
    }

    const role = await Role.findByPk(id);
    if (!role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    await User.update({ role_id: DEFAULT_ROLE_ID }, { where: { role_id: id } });
    await RolePermission.destroy({ where: { role_id: role.id } });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'deleted_role',
        description: `Deleted role: ${role.name}`,
        isGeneral: false,
    });

    await role.destroy();

    return success(res, {
        message: 'Role deleted successfully and associated users updated to default role',
    });
});

module.exports = { getRoles, getRole, createRole, updateRole, deleteRole };

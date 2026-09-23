// Permission management controller.
const { Op } = require('sequelize');
const Permission = require('../models/permission');
const RolePermission = require('../models/rolePermission');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const activityService = require('../services/activityService');

/** List permissions with pagination and search. */
const getPermissions = asyncHandler(async (req, res) => {
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

    const total = await Permission.count({ where: whereClause });

    const permissions = await Permission.findAll({
        where: whereClause,
        order: [[orderBy, order]],
        limit: Number(limit),
        offset,
    });

    for (const permission of permissions) {
        if (permission.created_by) {
            permission.dataValues.creator = await User.findByPk(permission.created_by, { attributes: ['name'] });
        }
        if (permission.updated_by) {
            permission.dataValues.updater = await User.findByPk(permission.updated_by, { attributes: ['name'] });
        }
    }

    return success(res, {
        message: 'Permissions retrieved successfully',
        data: { permissions, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    });
});

/** Get a permission by id. */
const getPermission = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
        throw new AppError('Permission not found', 404, { code: 'PERMISSION_NOT_FOUND' });
    }

    return success(res, { message: 'Permission retrieved successfully', data: permission });
});

/** Create a new permission. */
const createPermission = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new AppError('Name is required', 400, { code: 'MISSING_FIELDS' });
    }

    const check = await Permission.findOne({ where: { name } });
    if (check) {
        throw new AppError(`Permission with name '${name}' already exists`, 400, { code: 'PERMISSION_EXISTS' });
    }

    const permission = await Permission.create({
        name,
        description,
        created_by: req.user.id,
    });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'created_permission',
        description: `Created permission: ${permission.name}`,
        isGeneral: false,
    });

    return success(res, { statusCode: 201, message: 'Permission created successfully', data: permission });
});

/** Update a permission. */
const updatePermission = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
        throw new AppError('Permission not found', 404, { code: 'PERMISSION_NOT_FOUND' });
    }

    const check = await Permission.findOne({ where: { name } });
    if (check && check.name !== permission.name) {
        throw new AppError(`Permission with name '${name}' already exists`, 400, { code: 'PERMISSION_EXISTS' });
    }

    const updatedPermission = await permission.update({
        name,
        description,
        updated_by: req.user.id,
    });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'updated_permission',
        description: `Updated permission: ${permission.name}`,
        isGeneral: false,
    });

    return success(res, { message: 'Permission updated successfully', data: updatedPermission });
});

/** Delete a permission and its role associations. */
const deletePermission = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
        throw new AppError('Permission not found', 404, { code: 'PERMISSION_NOT_FOUND' });
    }

    await RolePermission.destroy({ where: { permission_id: permission.id } });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'deleted_permission',
        description: `Deleted permission: ${permission.name}`,
        isGeneral: false,
    });

    await permission.destroy();

    return success(res, { message: 'Permission deleted successfully' });
});

/** Bulk create permissions. */
const createBulkPermissions = asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('No items provided for bulk insert', 400, { code: 'MISSING_FIELDS' });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
        const row = items[i] || {};
        try {
            if (!row.name) throw new Error('Name is required');
            const check = await Permission.findOne({ where: { name: row.name } });
            if (check) throw new Error(`Permission with name '${row.name}' already exists`);
            const permission = await Permission.create({ name: row.name, description: row.description, created_by: req.user.id });
            created.push(permission);
        } catch (err) {
            errors.push({ row: i + 1, name: row.name || '-', message: err.message || 'Failed to create permission' });
        }
    }

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'created_permissions',
        description: `Bulk created ${created.length} permissions`,
        isGeneral: false,
    });

    return success(res, {
        statusCode: 201,
        message: `Bulk insert finished: ${created.length} created, ${errors.length} failed`,
        data: { createdCount: created.length, failedCount: errors.length, created, errors },
    });
});

/** Bulk delete permissions (and their role associations). */
const bulkDeletePermissions = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('IDs array is required and cannot be empty', 400, { code: 'MISSING_FIELDS' });
    }

    await RolePermission.destroy({ where: { permission_id: ids } });
    const deletedCount = await Permission.destroy({ where: { id: ids } });

    await activityService.logActivity(req, {
        userId: req.user.id,
        activityType: 'bulk_deleted_permissions',
        description: `Bulk deleted ${deletedCount} permissions`,
        isGeneral: false,
    });

    return success(res, {
        message: `${deletedCount} permissions deleted`,
        data: { deletedCount },
    });
});

module.exports = { getPermissions, getPermission, createPermission, createBulkPermissions, updatePermission, deletePermission, bulkDeletePermissions };

/**
 * Role management routes.
 */
const express = require('express');
const roleController = require('../controllers/roleController');
const rolePermissionController = require('../controllers/rolePermissionController');
const VerifyToken = require('../middlewares/verifyToken');
const checkPermission = require('../middlewares/checkPermission');

const router = express.Router();

// Listing is available to anyone who can view the dashboard.
router.get('/', VerifyToken, checkPermission('view_dashboard'), roleController.getRoles);

// Mutations require role management permission.
router.use(VerifyToken, checkPermission('manage_roles'));

router.post('/bulk', roleController.createBulkRoles);
router.delete('/bulk-delete', roleController.bulkDeleteRoles);
router.get('/:id', roleController.getRole);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Role ↔ permission assignments
router.get('/:roleId/permissions', rolePermissionController.getRolePermissions);
router.post('/:roleId/permissions', rolePermissionController.assignPermissionsToRole);
router.delete('/:roleId/permissions', rolePermissionController.removePermissionsFromRole);

module.exports = router;

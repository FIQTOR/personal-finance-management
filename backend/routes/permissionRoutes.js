/**
 * Permission management routes.
 */
const express = require('express');
const permissionController = require('../controllers/permissionController');
const VerifyToken = require('../middlewares/verifyToken');
const checkPermission = require('../middlewares/checkPermission');

const router = express.Router();

router.use(VerifyToken, checkPermission('manage_roles'));

router.get('/', permissionController.getPermissions);
router.post('/bulk', permissionController.createBulkPermissions);
router.delete('/bulk-delete', permissionController.bulkDeletePermissions);
router.get('/:id', permissionController.getPermission);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;

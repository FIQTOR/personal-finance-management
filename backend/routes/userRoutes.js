/**
 * User management routes (admin).
 */
const express = require('express');
const userController = require('../controllers/userController');
const VerifyToken = require('../middlewares/verifyToken');
const checkPermission = require('../middlewares/checkPermission');
const validate = require('../middlewares/validate');
const { userSchemas } = require('../validators/schemas');

const router = express.Router();

router.use(VerifyToken, checkPermission('manage_users'));

router.post('/', userController.upload.single('avatar'), validate(userSchemas.create), userController.createUser);
router.get('/', userController.getUsers);
router.post('/bulk', userController.createBulkUsers);
router.delete('/bulk-delete', userController.bulkDeleteUsers);
router.get('/:id', userController.getUser);
router.put('/:id', userController.upload.single('avatar'), validate(userSchemas.update), userController.updateUser);
router.put('/:id/reset-password', validate(userSchemas.resetPassword), userController.resetUserPassword);
router.delete('/:id', userController.deleteUser);

module.exports = router;

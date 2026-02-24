const express = require('express');
const { getRoles, createRole, updateRole, deleteRole, getPermissions } = require('../controllers/roleController');
const verifyToken = require('../middlewares/authMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');

const router = express.Router();

router.use(verifyToken);
router.use(checkPermission('manage_roles')); // ALL role operations require this

router.get('/permissions', getPermissions);

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;

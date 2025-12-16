const express = require('express');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { materialValidators } = require('../../middleware/validators');
const materialController = require('../controllers/materialController');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取物料列表(支持分页和搜索)
router.get('/', materialController.getMaterials);

// 获取单个物料详情
router.get('/:id', materialController.getMaterialById);

// 创建物料(需要系统管理员或库存管理员权限,使用输入验证)
router.post(
  '/',
  checkRole('system_admin', 'inventory_manager'),
  materialValidators.createOrUpdate,
  materialController.createMaterial
);

// 更新物料(需要系统管理员或库存管理员权限)
router.put(
  '/:id',
  checkRole('system_admin', 'inventory_manager'),
  materialController.updateMaterial
);

// 删除物料(仅系统管理员)
router.delete(
  '/:id',
  checkRole('system_admin'),
  materialController.deleteMaterial
);

module.exports = router;

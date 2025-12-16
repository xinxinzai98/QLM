const express = require('express');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { inventoryValidators } = require('../../middleware/validators');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 创建出入库单(普通人员可以创建,使用输入验证)
router.post(
  '/',
  inventoryValidators.create,
  inventoryController.createTransaction
);

// 获取出入库单列表(支持分页和筛选)
router.get('/', inventoryController.getTransactions);

// 获取单个出入库单详情
router.get('/:id', inventoryController.getTransactionById);

// 审批出入库单(仅库存管理员和系统管理员)
router.put(
  '/:id/approve',
  checkRole('inventory_manager', 'system_admin'),
  inventoryController.approveTransaction
);

// 取消出入库单(仅申请人可以取消待审批的单据)
router.put('/:id/cancel', inventoryController.cancelTransaction);

module.exports = router;

const express = require('express');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { dbGet, dbAll } = require('../../utils/dbHelper');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取仪表盘统计数据（并行查询优化）
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 并行执行所有查询，大幅提升性能
    const [
      materialCount,
      pendingCount,
      todayCount,
      lowStockCount,
      valueResult
    ] = await Promise.all([
      // 查询物料总数
      dbGet('SELECT COUNT(*) as total FROM materials'),
      
      // 查询待审批单数
      dbGet('SELECT COUNT(*) as total FROM inventory_transactions WHERE status = ?', ['pending']),
      
      // 查询今日出入库单数
      dbGet('SELECT COUNT(*) as total FROM inventory_transactions WHERE DATE(created_at) = ?', [today]),
      
      // 查询低库存物料数
      dbGet('SELECT COUNT(*) as total FROM materials WHERE current_stock <= min_stock AND min_stock > 0'),
      
      // 查询库存总价值
      dbAll(`SELECT 
        SUM(m.current_stock * COALESCE(avg_price.avg_price, 0)) as total_value
      FROM materials m
      LEFT JOIN (
        SELECT 
          material_id,
          AVG(unit_price) as avg_price
        FROM inventory_transactions
        WHERE unit_price IS NOT NULL AND status = 'approved'
        GROUP BY material_id
      ) avg_price ON m.id = avg_price.material_id`)
    ]);

    res.json({
      success: true,
      data: {
        totalMaterials: materialCount.total || 0,
        pendingTransactions: pendingCount.total || 0,
        todayTransactions: todayCount.total || 0,
        lowStockMaterials: lowStockCount.total || 0,
        totalInventoryValue: valueResult[0]?.total_value || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取物料分类统计
router.get('/materials-by-category', async (req, res, next) => {
  try {
    const results = await dbAll(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(current_stock) as total_stock
      FROM materials
      GROUP BY category`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// 获取最近出入库趋势（最近30天）
router.get('/transaction-trend', async (req, res, next) => {
  try {
    const results = await dbAll(
      `SELECT 
        DATE(created_at) as date,
        transaction_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM inventory_transactions
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at), transaction_type
      ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// 获取低库存物料列表
router.get('/low-stock-materials', async (req, res, next) => {
  try {
    const results = await dbAll(
      `SELECT 
        id,
        material_code,
        material_name,
        category,
        current_stock,
        min_stock,
        unit
      FROM materials
      WHERE current_stock <= min_stock AND min_stock > 0
      ORDER BY (current_stock / NULLIF(min_stock, 0)) ASC
      LIMIT 10`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// 获取待审批单列表（简化版）
router.get('/pending-transactions', async (req, res, next) => {
  try {
    const results = await dbAll(
      `SELECT 
        it.id,
        it.transaction_code,
        it.transaction_type,
        it.quantity,
        it.created_at,
        m.material_code,
        m.material_name,
        u.real_name as applicant_name
      FROM inventory_transactions it
      LEFT JOIN materials m ON it.material_id = m.id
      LEFT JOIN users u ON it.applicant_id = u.id
      WHERE it.status = 'pending'
      ORDER BY it.created_at ASC
      LIMIT 10`
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


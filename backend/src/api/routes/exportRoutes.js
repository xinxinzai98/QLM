/**
 * 数据导出路由
 * 支持导出物料、用户、出入库单等数据为Excel格式
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/database');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const XLSX = require('xlsx');

// 所有路由都需要认证
router.use(authenticateToken);

// 导出物料数据
router.post('/materials', checkRole('system_admin', 'inventory_manager'), (req, res, next) => {
  try {
    const { ids } = req.body;
    
    let query = `SELECT * FROM materials WHERE 1=1`;
    const params = [];
    
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...ids);
    }
    
    db.all(query, params, (err, materials) => {
      if (err) {
        return next(err);
      }
      
      // 转换为Excel格式
      const worksheet = XLSX.utils.json_to_sheet(materials.map(m => ({
        '物料编码': m.material_code,
        '物料名称': m.material_name,
        '类别': m.category === 'chemical' ? '化学物料' : '金属物料',
        '单位': m.unit,
        '当前库存': m.current_stock,
        '最低库存': m.min_stock,
        '最高库存': m.max_stock,
        '存放位置': m.location || '',
        '描述': m.description || '',
        '创建时间': m.created_at
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '物料列表');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=物料导出_${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;






const express = require('express');
const { db } = require('../../database/database');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { dbGet, dbAll, dbRun } = require('../../utils/dbHelper');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 生成盘点任务编号
const generateTaskCode = () => {
  const prefix = 'ST';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

/**
 * 创建盘点任务（系统管理员或库存管理员）
 * 优化：使用事务，并发获取物料信息，避免N+1查询
 */
router.post('/', checkRole('system_admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { taskName, startDate, endDate, remark, materialIds } = req.body;

    if (!taskName) {
      return res.status(400).json({ success: false, message: '任务名称为必填项' });
    }

    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return res.status(400).json({ success: false, message: '请至少选择一个物料' });
    }

    const taskCode = generateTaskCode();

    // 开启事务
    await dbRun('BEGIN TRANSACTION');

    try {
      // 1. 创建任务
      const taskResult = await dbRun(
        `INSERT INTO stocktaking_tasks 
         (task_code, task_name, start_date, end_date, creator_id, remark, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
        [taskCode, taskName, startDate || null, endDate || null, req.user.id, remark || null]
      );
      const taskId = taskResult.lastID;

      // 2. 获取所有选定物料的当前库存
      // 构建 WHERE id IN (?,?,?) 语句
      const placeholders = materialIds.map(() => '?').join(',');
      const materials = await dbAll(
        `SELECT id, current_stock FROM materials WHERE id IN (${placeholders})`,
        materialIds
      );

      if (materials.length === 0) {
        throw new Error('未找到有效的物料信息');
      }

      // 3. 批量插入盘点明细
      // SQLite不支持一次性插入多行的一条语句（除非使用UNION ALL技巧），或者使用Prepared Statement循环插入
      // 在事务中循环插入性能尚可
      const insertPromises = materials.map(m =>
        dbRun(
          `INSERT INTO stocktaking_items (task_id, material_id, book_stock) VALUES (?, ?, ?)`,
          [taskId, m.id, m.current_stock]
        )
      );
      await Promise.all(insertPromises);

      // 提交事务
      await dbRun('COMMIT');

      // 记录日志 (手动插入，避免引用不确定性)
      await dbRun(
        `INSERT INTO operation_logs 
           (user_id, module, action, description, ip_address, user_agent) 
           VALUES (?, 'stocktaking', 'create', ?, ?, ?)`,
        [req.user.id, `创建盘点任务: ${taskName}`, req.ip || '', req.headers['user-agent'] || '']
      );

      res.status(201).json({
        success: true,
        message: '盘点任务创建成功',
        data: {
          id: taskId,
          taskCode
        }
      });

    } catch (innerError) {
      await dbRun('ROLLBACK');
      throw innerError;
    }
  } catch (error) {
    next(error);
  }
});

// 获取盘点任务列表
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status = '' } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
      SELECT 
        st.*,
        u1.real_name as creator_name,
        u2.real_name as completed_by_name,
        (SELECT COUNT(*) FROM stocktaking_items WHERE task_id = st.id) as item_count,
        (SELECT COUNT(*) FROM stocktaking_items WHERE task_id = st.id AND actual_stock IS NOT NULL) as completed_count
      FROM stocktaking_tasks st
      LEFT JOIN users u1 ON st.creator_id = u1.id
      LEFT JOIN users u2 ON st.completed_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'regular_user') {
      query += ` AND st.creator_id = ?`;
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND st.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY st.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    let countQuery = `SELECT COUNT(*) as total FROM stocktaking_tasks WHERE 1=1`;
    const countParams = [];

    if (req.user.role === 'regular_user') {
      countQuery += ` AND creator_id = ?`;
      countParams.push(req.user.id);
    }

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const [countResult, tasks] = await Promise.all([
      dbGet(countQuery, countParams),
      dbAll(query, params)
    ]);

    res.json({
      success: true,
      data: {
        list: tasks,
        total: countResult.total,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取盘点任务详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await dbGet(
      `SELECT 
        st.*,
        u1.real_name as creator_name,
        u2.real_name as completed_by_name
      FROM stocktaking_tasks st
      LEFT JOIN users u1 ON st.creator_id = u1.id
      LEFT JOIN users u2 ON st.completed_by = u2.id
      WHERE st.id = ?`,
      [id]
    );

    if (!task || !task.id) {
      return res.status(404).json({ success: false, message: '盘点任务不存在' });
    }

    if (req.user.role === 'regular_user' && task.creator_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权查看此盘点任务' });
    }

    const items = await dbAll(
      `SELECT 
        si.*,
        m.material_code,
        m.material_name,
        m.unit,
        m.category
      FROM stocktaking_items si
      LEFT JOIN materials m ON si.material_id = m.id
      WHERE si.task_id = ?
      ORDER BY si.id`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...task,
        items
      }
    });
  } catch (error) {
    next(error);
  }
});

// 更新盘点明细（录入实际数量）
router.put('/:id/items/:itemId', checkRole('system_admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { actualStock, remark } = req.body;

    if (actualStock === undefined || actualStock === null) {
      return res.status(400).json({ success: false, message: '实际数量为必填项' });
    }

    const task = await dbGet('SELECT status FROM stocktaking_tasks WHERE id = ?', [id]);

    if (!task) {
      return res.status(404).json({ success: false, message: '盘点任务不存在' });
    }

    if (['completed', 'cancelled'].includes(task.status)) {
      return res.status(400).json({ success: false, message: '该盘点任务已结束，无法修改' });
    }

    const item = await dbGet('SELECT * FROM stocktaking_items WHERE id = ? AND task_id = ?', [itemId, id]);

    if (!item) {
      return res.status(404).json({ success: false, message: '盘点明细不存在' });
    }

    const difference = actualStock - item.book_stock;
    let differenceType = 'normal';
    if (difference > 0) differenceType = 'surplus';
    else if (difference < 0) differenceType = 'shortage';

    await dbRun(
      `UPDATE stocktaking_items 
       SET actual_stock = ?, difference = ?, difference_type = ?, remark = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [actualStock, difference, differenceType, remark || null, itemId]
    );

    // 可以在这里更新任务状态为 in_progress，无需 await
    if (task.status === 'draft') {
      dbRun(`UPDATE stocktaking_tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id])
        .catch(e => console.error('Auto-update status failed', e));
    }

    res.json({
      success: true,
      message: '盘点明细更新成功',
      data: {
        id: parseInt(itemId),
        actualStock,
        difference,
        differenceType
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 完成盘点任务并生成报告
 * 优化：使用事务处理库存更新，修复 Scope Bug
 */
router.put('/:id/complete', checkRole('system_admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { updateStock, remark } = req.body;

    const task = await dbGet('SELECT * FROM stocktaking_tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ success: false, message: '盘点任务不存在' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: '该盘点任务已完成' });
    }

    // 检查是否有未录入的项
    const countResult = await dbGet(
      `SELECT SUM(CASE WHEN actual_stock IS NULL THEN 1 ELSE 0 END) as incomplete
       FROM stocktaking_items WHERE task_id = ?`,
      [id]
    );

    if (countResult && countResult.incomplete > 0) {
      return res.status(400).json({
        success: false,
        message: `还有 ${countResult.incomplete} 个物料未录入实际数量，无法完成盘点`
      });
    }

    await dbRun('BEGIN TRANSACTION');

    try {
      if (updateStock) {
        const items = await dbAll(
          `SELECT material_id, actual_stock, book_stock, difference 
           FROM stocktaking_items WHERE task_id = ?`,
          [id]
        );

        // 串行更新比较安全，或 Promise.all
        for (const item of items) {
          // 更新物料库存
          await dbRun(
            `UPDATE materials SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [item.actual_stock, item.material_id]
          );

          // 记录库存历史
          await dbRun(
            `INSERT INTO stock_history 
             (material_id, change_type, quantity_change, stock_before, stock_after, operator_id, remark) 
             VALUES (?, 'adjust', ?, ?, ?, ?, ?)`,
            [
              item.material_id,
              item.difference,
              item.book_stock,
              item.actual_stock,
              req.user.id,
              `盘点调整: ${task.task_name}`
            ]
          );
        }
      }

      // 更新任务状态
      await dbRun(
        `UPDATE stocktaking_tasks 
         SET status = 'completed', completed_by = ?, completed_at = CURRENT_TIMESTAMP, 
         updated_at = CURRENT_TIMESTAMP, remark = ? 
         WHERE id = ?`,
        [req.user.id, remark || null, id]
      );

      await dbRun('COMMIT');

      // 生成报告
      const items = await dbAll(
        `SELECT 
          si.*, m.material_code, m.material_name, m.unit, m.category
        FROM stocktaking_items si
        LEFT JOIN materials m ON si.material_id = m.id
        WHERE si.task_id = ?
        ORDER BY ABS(si.difference) DESC`,
        [id]
      );

      const report = {
        totalItems: items.length,
        surplusCount: items.filter(i => i.difference_type === 'surplus').length,
        shortageCount: items.filter(i => i.difference_type === 'shortage').length,
        normalCount: items.filter(i => i.difference_type === 'normal').length,
        totalSurplus: items.filter(i => i.difference_type === 'surplus').reduce((sum, i) => sum + i.difference, 0),
        totalShortage: Math.abs(items.filter(i => i.difference_type === 'shortage').reduce((sum, i) => sum + i.difference, 0)),
        items: items
      };

      // 手动记录日志
      await dbRun(
        `INSERT INTO operation_logs 
           (user_id, module, action, description, ip_address, user_agent) 
           VALUES (?, 'stocktaking', 'complete', ?, ?, ?)`,
        [req.user.id, `完成盘点任务: ${task.task_name}`, req.ip || '', req.headers['user-agent'] || '']
      );

      res.json({
        success: true,
        message: '盘点任务完成',
        data: {
          taskId: parseInt(id),
          report
        }
      });

    } catch (innerError) {
      await dbRun('ROLLBACK');
      throw innerError;
    }

  } catch (error) {
    next(error);
  }
});

// 取消盘点任务
router.put('/:id/cancel', checkRole('system_admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await dbGet('SELECT status FROM stocktaking_tasks WHERE id = ?', [id]);

    if (!task) {
      return res.status(404).json({ success: false, message: '盘点任务不存在' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: '已完成的盘点任务无法取消' });
    }

    await dbRun(
      `UPDATE stocktaking_tasks SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: '盘点任务已取消' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

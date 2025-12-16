const express = require('express');
const { db } = require('../../database/database');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { dbGet, dbAll, dbRun } = require('../../utils/dbHelper');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取通知列表
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, type, isRead } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
      SELECT id, type, title, content, link, link_type, is_read, created_at, read_at
      FROM notifications
      WHERE (user_id = ? OR user_id IS NULL)
    `;
    const params = [req.user.id];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (isRead !== undefined) {
      query += ` AND is_read = ?`;
      params.push(isRead === 'true' ? 1 : 0);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total FROM notifications
      WHERE (user_id = ? OR user_id IS NULL)
    `;
    const countParams = [req.user.id];

    if (type) {
      countQuery += ` AND type = ?`;
      countParams.push(type);
    }

    if (isRead !== undefined) {
      countQuery += ` AND is_read = ?`;
      countParams.push(isRead === 'true' ? 1 : 0);
    }

    const [notifications, countResult] = await Promise.all([
      dbAll(query, params),
      dbGet(countQuery, countParams)
    ]);

    res.json({
      success: true,
      data: {
        list: notifications,
        total: countResult.total || 0,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取未读通知数量
router.get('/unread-count', async (req, res, next) => {
  try {
    const result = await dbGet(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        count: result.count || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// 标记通知为已读
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查通知是否存在且属于当前用户
    const notification = await dbGet(
      `SELECT id FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [id, req.user.id]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await dbRun(
      `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '标记已读成功'
    });
  } catch (error) {
    next(error);
  }
});

// 标记所有通知为已读
router.put('/read-all', async (req, res, next) => {
  try {
    await dbRun(
      `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: '全部标记已读成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除通知
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查通知是否存在且属于当前用户
    const notification = await dbGet(
      `SELECT id FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
      [id, req.user.id]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await dbRun(`DELETE FROM notifications WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 创建系统通知（仅系统管理员）
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'system_admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const { userId, type, title, content, link, linkType } = req.body;

    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: '类型和标题为必填项'
      });
    }

    await dbRun(
      `INSERT INTO notifications (user_id, type, title, content, link, link_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId || null, type, title, content || null, link || null, linkType || null]
    );

    res.json({
      success: true,
      message: '通知创建成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;






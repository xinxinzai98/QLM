const express = require('express');
const { db } = require('../../database/database');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 记录操作日志的中间件函数（供其他模块调用）
const logOperation = (req, module, action, resourceType = null, resourceId = null, description = null) => {
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'] || '';

  db.run(
    `INSERT INTO operation_logs 
     (user_id, module, action, resource_type, resource_id, description, ip_address, user_agent) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, module, action, resourceType, resourceId, description, ipAddress, userAgent],
    (err) => {
      if (err) {
        console.error('记录操作日志失败:', err);
      }
    }
  );
};

// 获取操作日志列表（仅系统管理员）
router.get('/', checkRole('system_admin'), (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, module = '', action = '', userId = '', startDate = '', endDate = '' } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
      SELECT 
        ol.*,
        u.username,
        u.real_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (module) {
      query += ` AND ol.module = ?`;
      params.push(module);
    }

    if (action) {
      query += ` AND ol.action = ?`;
      params.push(action);
    }

    if (userId) {
      query += ` AND ol.user_id = ?`;
      params.push(userId);
    }

    if (startDate) {
      query += ` AND DATE(ol.created_at) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(ol.created_at) <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY ol.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM operation_logs WHERE 1=1`;
    const countParams = [];

    if (module) {
      countQuery += ` AND module = ?`;
      countParams.push(module);
    }

    if (action) {
      countQuery += ` AND action = ?`;
      countParams.push(action);
    }

    if (userId) {
      countQuery += ` AND user_id = ?`;
      countParams.push(userId);
    }

    if (startDate) {
      countQuery += ` AND DATE(created_at) >= ?`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND DATE(created_at) <= ?`;
      countParams.push(endDate);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return next(err);
      }

      db.all(query, params, (err, logs) => {
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          data: {
            list: logs,
            total: countResult.total,
            page: parseInt(page),
            pageSize: limit
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// 获取操作统计（仅系统管理员）
router.get('/stats', checkRole('system_admin'), (req, res, next) => {
  try {
    const { startDate = '', endDate = '' } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = `WHERE DATE(created_at) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `WHERE DATE(created_at) >= ?`;
      params.push(startDate);
    } else if (endDate) {
      dateFilter = `WHERE DATE(created_at) <= ?`;
      params.push(endDate);
    }

    // 按模块统计
    db.all(
      `SELECT module, COUNT(*) as count 
       FROM operation_logs 
       ${dateFilter}
       GROUP BY module 
       ORDER BY count DESC`,
      params,
      (err, moduleStats) => {
        if (err) {
          return next(err);
        }

        // 按操作类型统计
        db.all(
          `SELECT action, COUNT(*) as count 
           FROM operation_logs 
           ${dateFilter}
           GROUP BY action 
           ORDER BY count DESC 
           LIMIT 10`,
          params,
          (err, actionStats) => {
            if (err) {
              return next(err);
            }

            // 按用户统计
            db.all(
              `SELECT u.username, u.real_name, COUNT(*) as count 
               FROM operation_logs ol
               LEFT JOIN users u ON ol.user_id = u.id
               ${dateFilter}
               GROUP BY ol.user_id 
               ORDER BY count DESC 
               LIMIT 10`,
              params,
              (err, userStats) => {
                if (err) {
                  return next(err);
                }

                res.json({
                  success: true,
                  data: {
                    moduleStats,
                    actionStats,
                    userStats
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// 导出日志记录函数供其他模块使用
module.exports = router;
module.exports.logOperation = logOperation;


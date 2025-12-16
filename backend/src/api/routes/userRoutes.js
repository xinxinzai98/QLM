const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../../database/database');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { logOperation } = require('./operationLogRoutes');
const { userValidators } = require('../../middleware/validators');
const { dbGet, dbRun } = require('../../utils/dbHelper');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户列表（仅系统管理员）
router.get('/', checkRole('system_admin'), (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', role = '' } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
      SELECT id, username, role, real_name, email, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      query += ` AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];

    if (keyword) {
      countQuery += ` AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (role) {
      countQuery += ` AND role = ?`;
      countParams.push(role);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return next(err);
      }

      db.all(query, params, (err, users) => {
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          data: {
            list: users,
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

// 获取单个用户信息
router.get('/:id', checkRole('system_admin'), (req, res, next) => {
  try {
    const { id } = req.params;

    db.get(
      'SELECT id, username, role, real_name, email, created_at, updated_at FROM users WHERE id = ?',
      [id],
      (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }

        res.json({
          success: true,
          data: user
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 创建用户（仅系统管理员）
router.post('/', checkRole('system_admin'), async (req, res, next) => {
  try {
    const { username, password, role, realName, email } = req.body;

    // 验证必填字段
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码和角色为必填项'
      });
    }

    // 验证角色
    const validRoles = ['system_admin', 'inventory_manager', 'regular_user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色类型'
      });
    }

    // 检查用户名是否已存在
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return next(err);
      }

      if (row) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 插入新用户
      db.run(
        `INSERT INTO users (username, password, role, real_name, email) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, hashedPassword, role, realName || null, email || null],
        function(err) {
          if (err) {
            return next(err);
          }

          // 记录操作日志
          logOperation(req, 'users', 'create', 'user', this.lastID, `创建用户: ${username}`);

          res.status(201).json({
            success: true,
            message: '用户创建成功',
            data: {
              id: this.lastID,
              username,
              role
            }
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

// 更新用户信息（仅系统管理员）
router.put('/:id', checkRole('system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password, role, realName, email } = req.body;

    // 检查用户是否存在
    const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
    
    if (!user || !user.id) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 如果更新用户名，先检查是否已被使用
    if (username !== undefined) {
      const existingUser = await dbGet('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      
      if (existingUser && existingUser.id) {
        return res.status(400).json({
          success: false,
          message: '用户名已被使用'
        });
      }
    }

    // 构建更新字段
    const updates = [];
    const params = [];

    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username);
    }

    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (role !== undefined) {
      const validRoles = ['system_admin', 'inventory_manager', 'regular_user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: '无效的角色类型'
        });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (realName !== undefined) {
      updates.push('real_name = ?');
      params.push(realName);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await dbRun(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // 记录操作日志
    logOperation(req, 'users', 'update', 'user', parseInt(id), '更新用户信息');

    res.json({
      success: true,
      message: '用户更新成功',
      data: {
        id: parseInt(id)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 删除用户（仅系统管理员，不能删除自己）
router.delete('/:id', checkRole('system_admin'), (req, res, next) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    // 检查用户是否存在
    db.get('SELECT id FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 删除用户
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          return next(err);
        }

          // 记录操作日志
          logOperation(req, 'users', 'delete', 'user', parseInt(id), '删除用户');

          res.json({
            success: true,
            message: '用户删除成功'
          });
      });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


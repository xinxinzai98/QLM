const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../database/database');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logOperation } = require('./operationLogRoutes');
const { authValidators } = require('../../middleware/validators');
const { dbGet, dbRun } = require('../../utils/dbHelper');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res, next) => {
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
    const existingUser = await dbGet('SELECT id FROM users WHERE username = ?', [username]);

    if (existingUser && existingUser.id) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const result = await dbRun(
      `INSERT INTO users (username, password, role, real_name, email) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, role, realName || null, email || null]
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: result.lastID,
        username,
        role
      }
    });
  } catch (error) {
    next(error);
  }
});

// 用户登录（使用输入验证）
router.post('/login', authValidators.login, (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    db.get(
      'SELECT id, username, password, role, real_name, email, avatar FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            message: '用户名或密码错误'
          });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: '用户名或密码错误'
          });
        }

        // 获取JWT密钥（与中间件保持一致）
        const getJWTSecret = () => {
          const secret = process.env.JWT_SECRET;
          const defaultSecret = 'your-super-secret-jwt-key-change-in-production';
          const isProduction = process.env.NODE_ENV === 'production';

          if (isProduction && (!secret || secret === defaultSecret)) {
            throw new Error('JWT_SECRET must be set in production environment');
          }

          return secret || defaultSecret;
        };

        // 生成Access Token（短期有效）
        const accessToken = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: user.role,
            type: 'access'
          },
          getJWTSecret(),
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } // 默认24小时
        );

        // 生成Refresh Token（长期有效）
        const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || getJWTSecret() + '_refresh';
        const refreshToken = jwt.sign(
          {
            id: user.id,
            type: 'refresh'
          },
          refreshTokenSecret,
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } // 默认30天
        );

        // 保存Refresh Token到数据库
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30); // 30天后过期

        db.run(
          `UPDATE users SET refresh_token = ?, refresh_token_expires_at = ? WHERE id = ?`,
          [refreshToken, refreshTokenExpiresAt.toISOString(), user.id],
          (err) => {
            if (err) {
              console.error('保存Refresh Token失败:', err);
            }
          }
        );

        // 记录操作日志
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'] || '';
        db.run(
          `INSERT INTO operation_logs 
           (user_id, module, action, description, ip_address, user_agent) 
           VALUES (?, 'auth', 'login', ?, ?, ?)`,
          [user.id, `用户登录: ${user.username}`, ipAddress, userAgent],
          (err) => {
            if (err) {
              console.error('记录登录日志失败:', err);
            }
          }
        );

        // 返回用户信息和令牌
        res.json({
          success: true,
          message: '登录成功',
          data: {
            accessToken,
            refreshToken,
            expiresIn: 3600, // Access Token有效期（秒）
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              realName: user.real_name,
              email: user.email,
              avatar: user.avatar ? `/uploads/avatars/${user.avatar}` : null
            }
          }
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 刷新Access Token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh Token不能为空'
      });
    }

    // 验证Refresh Token
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET ||
      (process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production') + '_refresh';

    jwt.verify(refreshToken, refreshTokenSecret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Refresh Token无效或已过期'
        });
      }

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: '无效的Token类型'
        });
      }

      // 检查数据库中的Refresh Token是否匹配
      db.get(
        'SELECT id, username, role, refresh_token, refresh_token_expires_at FROM users WHERE id = ?',
        [decoded.id],
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

          // 验证Refresh Token是否匹配且未过期
          if (user.refresh_token !== refreshToken) {
            return res.status(401).json({
              success: false,
              message: 'Refresh Token不匹配'
            });
          }

          const expiresAt = new Date(user.refresh_token_expires_at);
          if (expiresAt < new Date()) {
            return res.status(401).json({
              success: false,
              message: 'Refresh Token已过期'
            });
          }

          // 生成新的Access Token
          const getJWTSecret = () => {
            const secret = process.env.JWT_SECRET;
            const defaultSecret = 'your-super-secret-jwt-key-change-in-production';
            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction && (!secret || secret === defaultSecret)) {
              throw new Error('JWT_SECRET must be set in production environment');
            }

            return secret || defaultSecret;
          };

          const newAccessToken = jwt.sign(
            {
              id: user.id,
              username: user.username,
              role: user.role,
              type: 'access'
            },
            getJWTSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );

          res.json({
            success: true,
            message: 'Token刷新成功',
            data: {
              accessToken: newAccessToken,
              expiresIn: 3600
            }
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

// 登出（清除Refresh Token）
router.post('/logout', authenticateToken, (req, res, next) => {
  try {
    // 清除数据库中的Refresh Token
    db.run(
      'UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE id = ?',
      [req.user.id],
      (err) => {
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          message: '登出成功'
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    db.get(
      'SELECT id, username, role, real_name, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id],
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
          data: {
            id: user.id,
            username: user.username,
            role: user.role,
            realName: user.real_name,
            email: user.email,
            createdAt: user.created_at
          }
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;


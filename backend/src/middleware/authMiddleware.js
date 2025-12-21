const jwt = require('jsonwebtoken');

// 获取JWT密钥，强制要求环境变量配置
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 生产环境强制要求配置密钥
  if (isProduction && !secret) {
    throw new Error(
      'FATAL: JWT_SECRET must be set in production environment. ' +
      'Please set a strong secret key (minimum 32 characters) in environment variables.'
    );
  }
  
  // 验证密钥强度
  if (secret && secret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET must be at least 32 characters long. ' +
      'Current length: ' + secret.length
    );
  }
  
  // 开发环境：如果没有配置密钥，使用临时生成的密钥（每次启动不同）
  if (!isProduction && !secret) {
    const crypto = require('crypto');
    const tempSecret = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  WARNING: JWT_SECRET not set. Using temporary key for development.');
    console.warn('⚠️  Please set JWT_SECRET environment variable for production use.');
    console.warn('⚠️  Generated temporary key will change on each server restart.');
    return tempSecret;
  }
  
  return secret;
};

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失，请先登录'
    });
  }

  try {
    const secret = getJWTSecret();
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: '访问令牌无效或已过期'
        });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    // JWT密钥配置错误，返回500错误
    console.error('JWT Secret configuration error:', error.message);
    return res.status(500).json({
      success: false,
      message: '服务器配置错误，请联系管理员'
    });
  }
};

// 角色权限检查中间件
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作'
      });
    }

    next();
  };
};

// 角色映射（用于前端显示）
const roleMap = {
  'system_admin': '系统管理员',
  'inventory_manager': '库存管理员',
  'regular_user': '普通人员'
};

module.exports = {
  authenticateToken,
  checkRole,
  roleMap
};


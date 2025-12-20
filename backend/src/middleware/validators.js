/**
 * 输入验证中间件
 * 使用express-validator进行统一输入验证
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * 处理验证结果
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * 物料相关验证规则
 */
const materialValidators = {
  // 创建/更新物料
  createOrUpdate: [
    body('materialCode')
      .trim()
      .notEmpty().withMessage('物料编码不能为空')
      .isLength({ min: 1, max: 50 }).withMessage('物料编码长度必须在1-50个字符之间')
      .matches(/^[A-Za-z0-9_-]+$/).withMessage('物料编码只能包含字母、数字、下划线和连字符'),
    
    body('materialName')
      .trim()
      .notEmpty().withMessage('物料名称不能为空')
      .isLength({ min: 1, max: 100 }).withMessage('物料名称长度必须在1-100个字符之间'),
    
    body('category')
      .isIn(['chemical', 'metal']).withMessage('类别必须是 chemical 或 metal'),
    
    body('unit')
      .trim()
      .notEmpty().withMessage('单位不能为空')
      .isLength({ max: 20 }).withMessage('单位长度不能超过20个字符'),
    
    body('minStock')
      .optional()
      .isFloat({ min: 0 }).withMessage('最低库存必须大于等于0')
      .toFloat(),
    
    body('maxStock')
      .optional()
      .isFloat({ min: 0 }).withMessage('最高库存必须大于等于0')
      .toFloat(),
    
    body('location')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('存放位置长度不能超过200个字符'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('描述长度不能超过500个字符'),
    
    handleValidationErrors
  ],

  // 查询参数验证
  query: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
      .toInt(),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
      .toInt(),
    
    query('keyword')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('关键词长度不能超过100个字符'),
    
    query('category')
      .optional()
      .isIn(['chemical', 'metal']).withMessage('类别必须是 chemical 或 metal'),
    
    handleValidationErrors
  ],

  // ID参数验证
  id: [
    param('id')
      .isInt({ min: 1 }).withMessage('物料ID必须是正整数')
      .toInt(),
    
    handleValidationErrors
  ]
};

/**
 * 出入库单相关验证规则
 */
const inventoryValidators = {
  // 创建出入库单
  create: [
    body('transactionType')
      .isIn(['in', 'out']).withMessage('出入库类型必须是 in 或 out'),
    
    body('materialId')
      .isInt({ min: 1 }).withMessage('物料ID必须是正整数')
      .toInt(),
    
    body('quantity')
      .isFloat({ min: 0.01 }).withMessage('数量必须大于0')
      .toFloat(),
    
    body('unitPrice')
      .optional({ values: 'falsy' })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true; // 允许空值
        }
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          throw new Error('单价必须大于等于0');
        }
        return true;
      })
      .customSanitizer((value) => {
        if (value === null || value === undefined || value === '') {
          return undefined; // 转换为undefined，不会传递给后续验证
        }
        return parseFloat(value);
      }),
    
    body('remark')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
      .escape(), // XSS防护
    
    handleValidationErrors
  ],

  // 审批出入库单
  approve: [
    param('id')
      .isInt({ min: 1 }).withMessage('出入库单ID必须是正整数')
      .toInt(),
    
    body('action')
      .isIn(['approve', 'reject']).withMessage('操作必须是 approve 或 reject'),
    
    body('remark')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
      .escape(),
    
    handleValidationErrors
  ],

  // 查询参数验证
  query: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
      .toInt(),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
      .toInt(),
    
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'cancelled']).withMessage('状态值无效'),
    
    query('transactionType')
      .optional()
      .isIn(['in', 'out']).withMessage('类型必须是 in 或 out'),
    
    handleValidationErrors
  ]
};

/**
 * 用户相关验证规则
 */
const userValidators = {
  // 创建/更新用户
  createOrUpdate: [
    body('username')
      .trim()
      .notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间')
      .matches(/^[A-Za-z0-9_-]+$/).withMessage('用户名只能包含字母、数字、下划线和连字符'),
    
    body('password')
      .if(body('id').not().exists()) // 仅创建时必填
      .isLength({ min: 6 }).withMessage('密码长度不能少于6个字符')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('密码必须包含至少一个字母和一个数字'),
    
    body('role')
      .isIn(['system_admin', 'inventory_manager', 'regular_user']).withMessage('角色值无效'),
    
    body('realName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('真实姓名长度不能超过50个字符'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('邮箱格式无效')
      .normalizeEmail(),
    
    handleValidationErrors
  ],

  // ID参数验证
  id: [
    param('id')
      .isInt({ min: 1 }).withMessage('用户ID必须是正整数')
      .toInt(),
    
    handleValidationErrors
  ]
};

/**
 * 登录验证规则
 */
const authValidators = {
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('用户名不能为空')
      .isLength({ min: 1, max: 50 }).withMessage('用户名长度无效'),
    
    body('password')
      .notEmpty().withMessage('密码不能为空')
      .isLength({ min: 1 }).withMessage('密码不能为空'),
    
    handleValidationErrors
  ]
};

module.exports = {
  materialValidators,
  inventoryValidators,
  userValidators,
  authValidators,
  handleValidationErrors
};






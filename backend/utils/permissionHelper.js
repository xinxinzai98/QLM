/**
 * 权限验证工具函数
 * 提供角色权限检查逻辑
 */

const ROLE_HIERARCHY = {
  'system_admin': 3,
  'inventory_manager': 2,
  'regular_user': 1
};

/**
 * 检查用户是否有指定角色
 * @param {string} userRole - 用户角色
 * @param {string|string[]} allowedRoles - 允许的角色（单个或多个）
 * @returns {boolean} 是否有权限
 */
function hasRole(userRole, allowedRoles) {
  if (!userRole) return false;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
}

/**
 * 检查用户角色等级是否足够
 * @param {string} userRole - 用户角色
 * @param {string} requiredRole - 要求的角色
 * @returns {boolean} 角色等级是否足够
 */
function hasMinimumRole(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 999;
  
  return userLevel >= requiredLevel;
}

/**
 * 检查是否为管理员
 * @param {string} userRole - 用户角色
 * @returns {boolean} 是否为管理员
 */
function isAdmin(userRole) {
  return userRole === 'system_admin' || userRole === 'inventory_manager';
}

/**
 * 检查是否为系统管理员
 * @param {string} userRole - 用户角色
 * @returns {boolean} 是否为系统管理员
 */
function isSystemAdmin(userRole) {
  return userRole === 'system_admin';
}

module.exports = {
  hasRole,
  hasMinimumRole,
  isAdmin,
  isSystemAdmin
};


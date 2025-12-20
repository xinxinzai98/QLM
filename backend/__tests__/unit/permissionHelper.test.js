const {
  hasRole,
  hasMinimumRole,
  isAdmin,
  isSystemAdmin
} = require('../../utils/permissionHelper');

describe('权限验证工具函数', () => {
  describe('hasRole', () => {
    test('应该返回true当用户有指定角色时', () => {
      expect(hasRole('system_admin', 'system_admin')).toBe(true);
    });

    test('应该返回true当用户在允许的角色列表中时', () => {
      expect(hasRole('inventory_manager', ['system_admin', 'inventory_manager'])).toBe(true);
    });

    test('应该返回false当用户没有指定角色时', () => {
      expect(hasRole('regular_user', 'system_admin')).toBe(false);
    });

    test('应该返回false当用户角色为null时', () => {
      expect(hasRole(null, 'system_admin')).toBe(false);
    });
  });

  describe('hasMinimumRole', () => {
    test('应该返回true当用户角色等级足够时', () => {
      expect(hasMinimumRole('system_admin', 'inventory_manager')).toBe(true);
    });

    test('应该返回true当用户角色等级刚好时', () => {
      expect(hasMinimumRole('inventory_manager', 'inventory_manager')).toBe(true);
    });

    test('应该返回false当用户角色等级不足时', () => {
      expect(hasMinimumRole('regular_user', 'inventory_manager')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    test('应该返回true当用户是系统管理员时', () => {
      expect(isAdmin('system_admin')).toBe(true);
    });

    test('应该返回true当用户是库存管理员时', () => {
      expect(isAdmin('inventory_manager')).toBe(true);
    });

    test('应该返回false当用户是普通用户时', () => {
      expect(isAdmin('regular_user')).toBe(false);
    });
  });

  describe('isSystemAdmin', () => {
    test('应该返回true当用户是系统管理员时', () => {
      expect(isSystemAdmin('system_admin')).toBe(true);
    });

    test('应该返回false当用户是库存管理员时', () => {
      expect(isSystemAdmin('inventory_manager')).toBe(false);
    });

    test('应该返回false当用户是普通用户时', () => {
      expect(isSystemAdmin('regular_user')).toBe(false);
    });
  });
});


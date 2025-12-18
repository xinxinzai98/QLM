const {
  calculateNewStock,
  calculateTotalAmount,
  checkStockAvailable,
  isLowStock
} = require('../../utils/stockCalculator');

describe('库存计算工具函数', () => {
  describe('calculateNewStock', () => {
    test('应该正确计算入库后的库存', () => {
      expect(calculateNewStock(100, 50, 'in')).toBe(150);
    });

    test('应该正确计算出库后的库存', () => {
      expect(calculateNewStock(100, 30, 'out')).toBe(70);
    });

    test('应该处理小数库存', () => {
      expect(calculateNewStock(100.5, 25.3, 'in')).toBeCloseTo(125.8);
    });

    test('应该抛出错误当类型无效时', () => {
      expect(() => calculateNewStock(100, 50, 'invalid')).toThrow('Invalid transaction type');
    });
  });

  describe('calculateTotalAmount', () => {
    test('应该正确计算总金额', () => {
      expect(calculateTotalAmount(10, 5.5)).toBe(55);
    });

    test('应该返回null当单价为null时', () => {
      expect(calculateTotalAmount(10, null)).toBeNull();
    });

    test('应该返回null当单价为undefined时', () => {
      expect(calculateTotalAmount(10, undefined)).toBeNull();
    });

    test('应该处理小数计算', () => {
      expect(calculateTotalAmount(3, 1.33)).toBeCloseTo(3.99);
    });
  });

  describe('checkStockAvailable', () => {
    test('应该返回true当库存充足时', () => {
      expect(checkStockAvailable(100, 50)).toBe(true);
    });

    test('应该返回true当库存刚好时', () => {
      expect(checkStockAvailable(100, 100)).toBe(true);
    });

    test('应该返回false当库存不足时', () => {
      expect(checkStockAvailable(100, 150)).toBe(false);
    });
  });

  describe('isLowStock', () => {
    test('应该返回true当库存低于最低库存时', () => {
      expect(isLowStock(10, 20)).toBe(true);
    });

    test('应该返回true当库存等于最低库存时', () => {
      expect(isLowStock(20, 20)).toBe(true);
    });

    test('应该返回false当库存高于最低库存时', () => {
      expect(isLowStock(30, 20)).toBe(false);
    });

    test('应该返回false当最低库存为0时', () => {
      expect(isLowStock(10, 0)).toBe(false);
    });
  });
});


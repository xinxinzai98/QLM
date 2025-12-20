const {
  formatDate,
  formatDateTime,
  parseDate,
  isDateInRange
} = require('../../utils/dateTimeHelper');

describe('日期时间工具函数', () => {
  describe('formatDate', () => {
    test('应该正确格式化日期对象', () => {
      const date = new Date('2024-12-18T10:30:00Z');
      expect(formatDate(date)).toBe('2024-12-18');
    });

    test('应该正确格式化日期字符串', () => {
      expect(formatDate('2024-12-18')).toBe('2024-12-18');
    });

    test('应该返回null当日期为null时', () => {
      expect(formatDate(null)).toBeNull();
    });

    test('应该抛出错误当日期无效时', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date');
    });
  });

  describe('formatDateTime', () => {
    test('应该正确格式化日期时间对象', () => {
      const date = new Date('2024-12-18T10:30:45Z');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('应该正确格式化日期时间字符串', () => {
      const formatted = formatDateTime('2024-12-18T10:30:45');
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('应该返回null当日期为null时', () => {
      expect(formatDateTime(null)).toBeNull();
    });
  });

  describe('parseDate', () => {
    test('应该正确解析日期字符串', () => {
      const date = parseDate('2024-12-18');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // 0-based
      expect(date.getDate()).toBe(18);
    });

    test('应该返回null当字符串为null时', () => {
      expect(parseDate(null)).toBeNull();
    });

    test('应该抛出错误当日期字符串无效时', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date string');
    });
  });

  describe('isDateInRange', () => {
    test('应该返回true当日期在范围内时', () => {
      const date = new Date('2024-12-18');
      const start = new Date('2024-12-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    test('应该返回false当日期在范围外时', () => {
      const date = new Date('2024-11-30');
      const start = new Date('2024-12-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    test('应该正确处理边界日期', () => {
      const date = new Date('2024-12-01');
      const start = new Date('2024-12-01');
      const end = new Date('2024-12-31');
      expect(isDateInRange(date, start, end)).toBe(true);
    });
  });
});


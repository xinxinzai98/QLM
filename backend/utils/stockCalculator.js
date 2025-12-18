/**
 * 物料库存计算工具函数
 * 提供库存相关的计算逻辑
 */

/**
 * 计算新的库存数量
 * @param {number} currentStock - 当前库存
 * @param {number} quantity - 变更数量（正数为入库，负数为出库）
 * @param {string} type - 类型 'in' | 'out'
 * @returns {number} 新的库存数量
 */
function calculateNewStock(currentStock, quantity, type) {
  if (type === 'in') {
    return currentStock + quantity;
  } else if (type === 'out') {
    return currentStock - quantity;
  }
  throw new Error(`Invalid transaction type: ${type}`);
}

/**
 * 计算总金额
 * @param {number} quantity - 数量
 * @param {number|null} unitPrice - 单价（可选）
 * @returns {number|null} 总金额，如果单价为空则返回null
 */
function calculateTotalAmount(quantity, unitPrice) {
  if (unitPrice === null || unitPrice === undefined) {
    return null;
  }
  return quantity * unitPrice;
}

/**
 * 检查库存是否充足
 * @param {number} currentStock - 当前库存
 * @param {number} requiredQuantity - 需要的数量
 * @returns {boolean} 库存是否充足
 */
function checkStockAvailable(currentStock, requiredQuantity) {
  return currentStock >= requiredQuantity;
}

/**
 * 检查是否低库存
 * @param {number} currentStock - 当前库存
 * @param {number} minStock - 最低库存阈值
 * @returns {boolean} 是否低库存
 */
function isLowStock(currentStock, minStock) {
  return minStock > 0 && currentStock <= minStock;
}

module.exports = {
  calculateNewStock,
  calculateTotalAmount,
  checkStockAvailable,
  isLowStock
};


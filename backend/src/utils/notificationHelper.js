/**
 * 通知创建辅助工具
 * 用于统一创建系统通知的逻辑
 */

const { dbRun, dbAll } = require('./dbHelper');

/**
 * 创建待审批通知给审批人
 * @param {number} transactionId - 出入库单ID
 * @param {string} transactionType - 类型（'in' 或 'out'）
 * @param {string} materialName - 物料名称
 * @param {number} quantity - 数量
 * @param {string} unit - 单位
 * @returns {Promise<void>}
 */
async function createApprovalNotification(transactionId, transactionType, materialName, quantity, unit) {
  try {
    // 获取所有审批人（库存管理员和系统管理员）
    const approvers = await dbAll(
      `SELECT id FROM users WHERE role IN ('inventory_manager', 'system_admin')`,
      []
    );

    if (!approvers || approvers.length === 0) {
      return;
    }

    // 为每个审批人创建通知
    const notificationPromises = approvers.map(approver => {
      const typeText = transactionType === 'in' ? '入库' : '出库';
      return dbRun(
        `INSERT INTO notifications (user_id, type, title, content, link, link_type)
         VALUES (?, 'todo', ?, ?, ?, 'transaction')`,
        [
          approver.id,
          `待审批${typeText}单`,
          `物料 ${materialName} 的${typeText}申请待审批，数量：${quantity} ${unit}`,
          `/inventory?id=${transactionId}`
        ]
      );
    });

    // 并行创建所有通知（不阻塞主流程）
    await Promise.all(notificationPromises);
  } catch (error) {
    // 记录错误但不中断主流程
    console.error('创建审批通知失败:', error);
  }
}

/**
 * 删除与特定事务相关的待办通知
 * @param {number} transactionId - 出入库单ID
 * @returns {Promise<void>}
 */
async function removeTransactionNotifications(transactionId) {
  try {
    await dbRun(
      `DELETE FROM notifications 
       WHERE link_type = 'transaction' 
       AND link LIKE ?`,
      [`%/inventory?id=${transactionId}%`]
    );
  } catch (error) {
    // 记录错误但不中断主流程
    console.error('删除事务通知失败:', error);
  }
}

module.exports = {
  createApprovalNotification,
  removeTransactionNotifications
};





const { dbGet, dbAll, dbRun } = require('../utils/dbHelper');

/**
 * 出入库数据访问层 (Inventory Model)
 * 封装所有与 inventory_transactions 表相关的数据库操作
 */

/**
 * 生成唯一的出入库单号
 * @param {string} transactionType - 'in' 或 'out'
 * @returns {string}
 */
function generateTransactionCode(transactionType) {
    const prefix = transactionType === 'in' ? 'IN' : 'OUT';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

/**
 * 创建出入库单
 * @param {Object} transactionData - 出入库单数据
 * @returns {Promise<{lastID: number, transactionCode: string}>}
 */
async function create(transactionData) {
    const {
        transactionType,
        materialId,
        quantity,
        unitPrice,
        applicantId,
        remark
    } = transactionData;

    const transactionCode = generateTransactionCode(transactionType);
    const totalAmount = unitPrice ? quantity * unitPrice : null;

    const result = await dbRun(
        `INSERT INTO inventory_transactions 
     (transaction_code, transaction_type, material_id, quantity, unit_price, total_amount, applicant_id, status, remark) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
            transactionCode,
            transactionType,
            materialId,
            quantity,
            unitPrice || null,
            totalAmount,
            applicantId,
            remark || null
        ]
    );

    return {
        lastID: result.lastID,
        transactionCode
    };
}

/**
 * 获取出入库单列表(支持分页和过滤)
 * @param {Object} options - 查询选项
 * @returns {Promise<{list: Array, total: number}>}
 */
async function findAll(options) {
    const {
        page = 1,
        pageSize = 10,
        status = '',
        transactionType = '',
        materialId = '',
        userRole,
        userId
    } = options;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
    SELECT 
      it.*,
      m.material_code,
      m.material_name,
      m.category,
      m.unit,
      u1.real_name as applicant_name,
      u2.real_name as approver_name
    FROM inventory_transactions it
    LEFT JOIN materials m ON it.material_id = m.id
    LEFT JOIN users u1 ON it.applicant_id = u1.id
    LEFT JOIN users u2 ON it.approver_id = u2.id
    WHERE 1=1
  `;
    const params = [];

    // 普通人员只能看到自己创建的
    if (userRole === 'regular_user') {
        query += ` AND it.applicant_id = ?`;
        params.push(userId);
    }

    // 库存管理员可以看到待审批的
    if (userRole === 'inventory_manager') {
        query += ` AND (it.status = 'pending' OR it.approver_id = ?)`;
        params.push(userId);
    }

    if (status) {
        query += ` AND it.status = ?`;
        params.push(status);
    }

    if (transactionType) {
        query += ` AND it.transaction_type = ?`;
        params.push(transactionType);
    }

    if (materialId) {
        query += ` AND it.material_id = ?`;
        params.push(materialId);
    }

    query += ` ORDER BY it.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 获取总数
    let countQuery = `
    SELECT COUNT(*) as total 
    FROM inventory_transactions it
    WHERE 1=1
  `;
    const countParams = [];

    if (userRole === 'regular_user') {
        countQuery += ` AND it.applicant_id = ?`;
        countParams.push(userId);
    }

    if (userRole === 'inventory_manager') {
        countQuery += ` AND (it.status = 'pending' OR it.approver_id = ?)`;
        countParams.push(userId);
    }

    if (status) {
        countQuery += ` AND it.status = ?`;
        countParams.push(status);
    }

    if (transactionType) {
        countQuery += ` AND it.transaction_type = ?`;
        countParams.push(transactionType);
    }

    if (materialId) {
        countQuery += ` AND it.material_id = ?`;
        countParams.push(materialId);
    }

    const [countResult, transactions] = await Promise.all([
        dbGet(countQuery, countParams),
        dbAll(query, params)
    ]);

    return {
        list: transactions,
        total: countResult.total || 0
    };
}

/**
 * 根据ID获取出入库单详情
 * @param {number} id - 出入库单ID
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
    const transaction = await dbGet(
        `SELECT 
      it.*,
      m.material_code,
      m.material_name,
      m.category,
      m.unit,
      m.current_stock,
      u1.real_name as applicant_name,
      u2.real_name as approver_name
    FROM inventory_transactions it
    LEFT JOIN materials m ON it.material_id = m.id
    LEFT JOIN users u1 ON it.applicant_id = u1.id
    LEFT JOIN users u2 ON it.approver_id = u2.id
    WHERE it.id = ?`,
        [id]
    );

    return (transaction && transaction.id) ? transaction : null;
}

/**
 * 获取出入库单及其关联物料当前库存
 * @param {number} id - 出入库单ID
 * @returns {Promise<Object|null>}
 */
async function findByIdWithStock(id) {
    const transaction = await dbGet(
        `SELECT it.*, m.current_stock 
     FROM inventory_transactions it
     LEFT JOIN materials m ON it.material_id = m.id
     WHERE it.id = ?`,
        [id]
    );

    return (transaction && transaction.id) ? transaction : null;
}

/**
 * 更新出入库单状态
 * @param {number} id - 出入库单ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<{changes: number}>}
 */
async function updateStatus(id, updateData) {
    const { status, approverId, approvedAt } = updateData;

    const result = await dbRun(
        `UPDATE inventory_transactions 
     SET status = ?, approver_id = ?, approved_at = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
        [status, approverId, approvedAt, id]
    );

    return result;
}

/**
 * 取消出入库单
 * @param {number} id - 出入库单ID
 * @returns {Promise<{changes: number}>}
 */
async function cancel(id) {
    const result = await dbRun(
        `UPDATE inventory_transactions 
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
        [id]
    );

    return result;
}

/**
 * 更新物料库存
 * @param {number} materialId - 物料ID
 * @param {number} newStock - 新库存数量
 * @returns {Promise<{changes: number}>}
 */
async function updateMaterialStock(materialId, newStock) {
    const result = await dbRun(
        `UPDATE materials SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newStock, materialId]
    );

    return result;
}

/**
 * 记录库存变更历史
 * @param {Object} historyData - 库存变更历史数据
 * @returns {Promise<{lastID: number}>}
 */
async function createStockHistory(historyData) {
    const {
        materialId,
        transactionId,
        changeType,
        quantityChange,
        stockBefore,
        stockAfter,
        operatorId,
        remark
    } = historyData;

    const result = await dbRun(
        `INSERT INTO stock_history 
     (material_id, transaction_id, change_type, quantity_change, stock_before, stock_after, operator_id, remark) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            materialId,
            transactionId,
            changeType,
            quantityChange,
            stockBefore,
            stockAfter,
            operatorId,
            remark || null
        ]
    );

    return result;
}

module.exports = {
    generateTransactionCode,
    create,
    findAll,
    findById,
    findByIdWithStock,
    updateStatus,
    cancel,
    updateMaterialStock,
    createStockHistory
};

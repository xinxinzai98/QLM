const inventoryModel = require('../models/inventoryModel');
const materialModel = require('../models/materialModel');
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const operationLogModel = require('../models/operationLogModel');
const { dbRun } = require('../utils/dbHelper');

/**
 * 出入库业务逻辑层 (Inventory Service)
 * 处理出入库相关的业务逻辑,包含复杂的审批和库存更新逻辑
 */

/**
 * 创建出入库单
 * @param {Object} transactionData - 出入库单数据
 * @param {Object} user - 当前用户
 * @param {Object} requestInfo - 请求信息 {ipAddress, userAgent}
 * @returns {Promise<Object>}
 */
async function createTransaction(transactionData, user, requestInfo = {}) {
    const { transactionType, materialId, quantity, unitPrice, remark } = transactionData;

    // 检查物料是否存在
    const material = await materialModel.findById(materialId);
    if (!material) {
        const error = new Error('物料不存在');
        error.status = 404;
        throw error;
    }

    // 如果是出库,检查库存是否充足
    if (transactionType === 'out' && material.current_stock < quantity) {
        const error = new Error(`库存不足,当前库存:${material.current_stock}`);
        error.status = 400;
        throw error;
    }

    // 创建出入库单
    const result = await inventoryModel.create({
        transactionType,
        materialId,
        quantity,
        unitPrice,
        applicantId: user.id,
        remark
    });

    // 记录操作日志
    await operationLogModel.create({
        userId: user.id,
        action: 'create',
        module: 'inventory',
        targetType: 'transaction',
        targetId: result.lastID,
        details: `创建${transactionType === 'in' ? '入库' : '出库'}单: ${result.transactionCode}`,
        ipAddress: requestInfo.ipAddress || null,
        userAgent: requestInfo.userAgent || null
    });

    // 创建待办通知给审批人(异步)
    createApprovalNotifications(
        result.lastID,
        transactionType,
        material.material_name,
        quantity,
        material.unit
    ).catch(err => console.error('创建通知失败:', err));

    return {
        id: result.lastID,
        transactionCode: result.transactionCode,
        status: 'pending'
    };
}

/**
 * 获取出入库单列表
 * @param {Object} query - 查询参数
 * @param {Object} user - 当前用户
 * @returns {Promise<Object>}
 */
async function getTransactions(query, user) {
    const { page = 1, pageSize = 10, status = '', transactionType = '', materialId = '' } = query;

    const result = await inventoryModel.findAll({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        status,
        transactionType,
        materialId,
        userRole: user.role,
        userId: user.id
    });

    return {
        list: result.list,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
    };
}

/**
 * 获取出入库单详情
 * @param {number} id - 出入库单ID
 * @param {Object} user - 当前用户
 * @returns {Promise<Object>}
 */
async function getTransactionById(id, user) {
    const transaction = await inventoryModel.findById(id);

    if (!transaction) {
        const error = new Error('出入库单不存在');
        error.status = 404;
        throw error;
    }

    // 权限检查:普通人员只能查看自己创建的
    if (user.role === 'regular_user' && transaction.applicant_id !== user.id) {
        const error = new Error('无权查看此出入库单');
        error.status = 403;
        throw error;
    }

    return transaction;
}

/**
 * 审批出入库单(带事务处理)
 * @param {number} id - 出入库单ID
 * @param {string} action - 'approve' 或 'reject'
 * @param {string} remark - 审批备注
 * @param {Object} user - 当前用户
 * @param {Object} requestInfo - 请求信息 {ipAddress, userAgent}
 * @returns {Promise<Object>}
 */
async function approveTransaction(id, action, remark, user, requestInfo = {}) {
    if (!action || !['approve', 'reject'].includes(action)) {
        const error = new Error('操作类型必须是 approve 或 reject');
        error.status = 400;
        throw error;
    }

    // 开启事务
    await dbRun('BEGIN TRANSACTION');

    try {
        // 获取出入库单信息
        const transaction = await inventoryModel.findByIdWithStock(id);

        if (!transaction) {
            await dbRun('ROLLBACK');
            const error = new Error('出入库单不存在');
            error.status = 404;
            throw error;
        }

        if (transaction.status !== 'pending') {
            await dbRun('ROLLBACK');
            const error = new Error('该出入库单已处理,无法重复操作');
            error.status = 400;
            throw error;
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const approvedAt = action === 'approve' ? new Date().toISOString() : null;

        // 如果审批通过,更新库存
        if (action === 'approve') {
            const stockChange =
                transaction.transaction_type === 'in'
                    ? transaction.quantity
                    : -transaction.quantity;
            const newStock = transaction.current_stock + stockChange;

            // 出库时再次检查库存
            if (transaction.transaction_type === 'out' && newStock < 0) {
                await dbRun('ROLLBACK');
                const error = new Error('库存不足,无法批准出库');
                error.status = 400;
                throw error;
            }

            // 更新库存
            await inventoryModel.updateMaterialStock(transaction.material_id, newStock);

            // 记录库存变更历史
            await inventoryModel.createStockHistory({
                materialId: transaction.material_id,
                transactionId: transaction.id,
                changeType: transaction.transaction_type,
                quantityChange: stockChange,
                stockBefore: transaction.current_stock,
                stockAfter: newStock,
                operatorId: user.id,
                remark
            });
        }

        // 更新单据状态
        await inventoryModel.updateStatus(id, {
            status: newStatus,
            approverId: user.id,
            approvedAt
        });

        // 提交事务
        await dbRun('COMMIT');

        // 记录操作日志(放在事务外)
        await operationLogModel.create({
            userId: user.id,
            action: action === 'approve' ? 'approve' : 'reject',
            module: 'inventory',
            targetType: 'transaction',
            targetId: id,
            details: `${action === 'approve' ? '批准' : '拒绝'}出入库单`,
            ipAddress: requestInfo.ipAddress || null,
            userAgent: requestInfo.userAgent || null
        });

        return {
            id,
            status: newStatus
        };
    } catch (error) {
        await dbRun('ROLLBACK');
        throw error;
    }
}

/**
 * 取消出入库单
 * @param {number} id - 出入库单ID
 * @param {Object} user - 当前用户
 * @returns {Promise<void>}
 */
async function cancelTransaction(id, user) {
    const transaction = await inventoryModel.findById(id);

    if (!transaction) {
        const error = new Error('出入库单不存在');
        error.status = 404;
        throw error;
    }

    // 只有申请人可以取消,且必须是待审批状态
    if (transaction.applicant_id !== user.id) {
        const error = new Error('无权取消此出入库单');
        error.status = 403;
        throw error;
    }

    if (transaction.status !== 'pending') {
        const error = new Error('只能取消待审批状态的出入库单');
        error.status = 400;
        throw error;
    }

    await inventoryModel.cancel(id);

    // 记录操作日志
    await operationLogModel.create({
        userId: user.id,
        action: 'cancel',
        module: 'inventory',
        targetType: 'transaction',
        targetId: id,
        details: '取消出入库单',
        ipAddress: requestInfo.ipAddress || null,
        userAgent: requestInfo.userAgent || null
    });
}

/**
 * 创建待办通知给审批人(辅助函数)
 * @param {number} transactionId - 出入库单ID
 * @param {string} transactionType - 'in' 或 'out'
 * @param {string} materialName - 物料名称
 * @param {number} quantity - 数量
 * @param {string} unit - 单位
 */
async function createApprovalNotifications(transactionId, transactionType, materialName, quantity, unit) {
    try {
        // 查找所有审批人
        const approvers = await userModel.findByRoles(['inventory_manager', 'system_admin']);

        if (approvers && approvers.length > 0) {
            const notifications = approvers.map(approver => ({
                userId: approver.id,
                type: 'todo',
                title: `待审批${transactionType === 'in' ? '入库' : '出库'}单`,
                content: `物料 ${materialName} 的${transactionType === 'in' ? '入库' : '出库'}申请待审批,数量:${quantity} ${unit}`,
                link: `/inventory?id=${transactionId}`,
                linkType: 'transaction'
            }));

            await notificationModel.createBatch(notifications);
        }
    } catch (error) {
        console.error('创建审批通知失败:', error);
    }
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    approveTransaction,
    cancelTransaction
};

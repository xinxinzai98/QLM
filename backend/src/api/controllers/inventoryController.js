const inventoryService = require('../../services/inventoryService');
const { getClientIP, getUserAgent } = require('../../utils/requestHelper');

/**
 * 出入库控制器 (Inventory Controller)
 * 处理出入库相关的HTTP请求和响应
 */

/**
 * 创建出入库单
 */
async function createTransaction(req, res, next) {
    try {
        const requestInfo = {
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req)
        };
        const data = await inventoryService.createTransaction(req.body, req.user, requestInfo);
        res.status(201).json({
            success: true,
            message: '出入库单创建成功,等待审批',
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 获取出入库单列表
 */
async function getTransactions(req, res, next) {
    try {
        const data = await inventoryService.getTransactions(req.query, req.user);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 获取单个出入库单详情
 */
async function getTransactionById(req, res, next) {
    try {
        const { id } = req.params;
        const data = await inventoryService.getTransactionById(parseInt(id), req.user);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 审批出入库单
 */
async function approveTransaction(req, res, next) {
    try {
        const { id } = req.params;
        const { action, remark } = req.body;
        const data = await inventoryService.approveTransaction(
            parseInt(id),
            action,
            remark,
            req.user
        );
        res.json({
            success: true,
            message: action === 'approve' ? '出入库单已批准' : '出入库单已拒绝',
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 取消出入库单
 */
async function cancelTransaction(req, res, next) {
    try {
        const { id } = req.params;
        const requestInfo = {
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req)
        };
        await inventoryService.cancelTransaction(parseInt(id), req.user, requestInfo);
        res.json({
            success: true,
            message: '出入库单已取消'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    approveTransaction,
    cancelTransaction
};

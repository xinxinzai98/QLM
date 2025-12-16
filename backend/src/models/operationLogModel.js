const { dbGet, dbAll, dbRun } = require('../utils/dbHelper');

/**
 * 操作日志数据访问层 (Operation Log Model)
 * 封装所有与 operation_logs 表相关的数据库操作
 */

/**
 * 创建操作日志
 * @param {Object} logData - 日志数据
 * @returns {Promise<{lastID: number}>}
 */
async function create(logData) {
    const {
        userId,
        action,
        module,
        targetType,
        targetId,
        details,
        ipAddress,
        userAgent
    } = logData;

    // 注意:数据库schema使用 resource_type 和 resource_id, 不是 target_type和target_id
    // 同时数据库没有 username 字段
    const result = await dbRun(
        `INSERT INTO operation_logs 
     (user_id, module, action, resource_type, resource_id, description, ip_address, user_agent) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            module,
            action,
            targetType || null,
            targetId || null,
            details || null,
            ipAddress || null,
            userAgent || null
        ]
    );

    return result;
}

/**
 * 获取操作日志列表(支持分页和过滤)
 * @param {Object} options - 查询选项
 * @returns {Promise<{list: Array, total: number}>}
 */
async function findAll(options) {
    const {
        page = 1,
        pageSize = 10,
        module = '',
        action = '',
        userId = ''
    } = options;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
    SELECT * FROM operation_logs
    WHERE 1=1
  `;
    const params = [];

    if (module) {
        query += ` AND module = ?`;
        params.push(module);
    }

    if (action) {
        query += ` AND action = ?`;
        params.push(action);
    }

    if (userId) {
        query += ` AND user_id = ?`;
        params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 计数查询
    let countQuery = `SELECT COUNT(*) as total FROM operation_logs WHERE 1=1`;
    const countParams = [];

    if (module) {
        countQuery += ` AND module = ?`;
        countParams.push(module);
    }

    if (action) {
        countQuery += ` AND action = ?`;
        countParams.push(action);
    }

    if (userId) {
        countQuery += ` AND user_id = ?`;
        countParams.push(userId);
    }

    const [countResult, logs] = await Promise.all([
        dbGet(countQuery, countParams),
        dbAll(query, params)
    ]);

    return {
        list: logs,
        total: countResult.total || 0
    };
}

module.exports = {
    create,
    findAll
};

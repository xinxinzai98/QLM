const { dbGet, dbAll, dbRun } = require('../utils/dbHelper');

/**
 * 通知数据访问层 (Notification Model)
 * 封装所有与 notifications 表相关的数据库操作
 */

/**
 * 创建单个通知
 * @param {Object} notificationData - 通知数据
 * @returns {Promise<{lastID: number}>}
 */
async function create(notificationData) {
    const { userId, type, title, content, link, linkType } = notificationData;

    const result = await dbRun(
        `INSERT INTO notifications (user_id, type, title, content, link, link_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            userId,
            type,
            title,
            content,
            link || null,
            linkType || null
        ]
    );

    return result;
}

/**
 * 批量创建通知
 * @param {Array<Object>} notificationList - 通知数据数组
 * @returns {Promise<Array>}
 */
async function createBatch(notificationList) {
    const promises = notificationList.map(notification =>
        create(notification).catch(err => {
            console.error(`创建通知失败:`, err);
            return null;
        })
    );

    return Promise.all(promises);
}

/**
 * 获取用户通知列表(支持分页和过滤)
 * @param {Object} options - 查询选项
 * @returns {Promise<{list: Array, total: number, unreadCount: number}>}
 */
async function findByUser(options) {
    const {
        userId,
        page = 1,
        pageSize = 10,
        type = '',
        isRead = ''
    } = options;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
    SELECT * FROM notifications
    WHERE user_id = ?
  `;
    const params = [userId];

    if (type) {
        query += ` AND type = ?`;
        params.push(type);
    }

    if (isRead !== '') {
        query += ` AND is_read = ?`;
        params.push(isRead === 'true' || isRead === '1' ? 1 : 0);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 计数查询
    let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`;
    const countParams = [userId];

    if (type) {
        countQuery += ` AND type = ?`;
        countParams.push(type);
    }

    if (isRead !== '') {
        countQuery += ` AND is_read = ?`;
        countParams.push(isRead === 'true' || isRead === '1' ? 1 : 0);
    }

    // 未读数量查询
    const unreadCountQuery = `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`;

    const [countResult, notifications, unreadResult] = await Promise.all([
        dbGet(countQuery, countParams),
        dbAll(query, params),
        dbGet(unreadCountQuery, [userId])
    ]);

    return {
        list: notifications,
        total: countResult.total || 0,
        unreadCount: unreadResult.count || 0
    };
}

/**
 * 标记单个通知为已读
 * @param {number} id - 通知ID
 * @param {number} userId - 用户ID(用于权限校验)
 * @returns {Promise<{changes: number}>}
 */
async function markAsRead(id, userId) {
    const result = await dbRun(
        `UPDATE notifications 
     SET is_read = 1 
     WHERE id = ? AND user_id = ?`,
        [id, userId]
    );

    return result;
}

/**
 * 标记用户所有通知为已读
 * @param {number} userId - 用户ID
 * @returns {Promise<{changes: number}>}
 */
async function markAllAsRead(userId) {
    const result = await dbRun(
        `UPDATE notifications 
     SET is_read = 1 
     WHERE user_id = ? AND is_read = 0`,
        [userId]
    );

    return result;
}

/**
 * 删除通知
 * @param {number} id - 通知ID
 * @param {number} userId - 用户ID(用于权限校验)
 * @returns {Promise<{changes: number}>}
 */
async function deleteById(id, userId) {
    const result = await dbRun(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [id, userId]
    );

    return result;
}

module.exports = {
    create,
    createBatch,
    findByUser,
    markAsRead,
    markAllAsRead,
    deleteById
};

const { dbGet, dbAll, dbRun } = require('../utils/dbHelper');

/**
 * 用户数据访问层 (User Model)
 * 封装所有与 users 表相关的数据库操作
 */

/**
 * 根据用户名查找用户
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>}
 */
async function findByUsername(username) {
    const user = await dbGet(
        'SELECT * FROM users WHERE username = ?',
        [username]
    );

    return (user && user.id) ? user : null;
}

/**
 * 根据ID查找用户
 * @param {number} id - 用户ID
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
    const user = await dbGet(
        'SELECT id, username, real_name, role, email, phone, avatar, created_at, updated_at FROM users WHERE id = ?',
        [id]
    );

    return (user && user.id) ? user : null;
}

/**
 * 获取所有用户列表(支持分页)
 * @param {Object} options - 查询选项
 * @returns {Promise<{list: Array, total: number}>}
 */
async function findAll({ page = 1, pageSize = 10, keyword = '' }) {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let query = `
    SELECT id, username, real_name, role, email, phone, avatar, created_at
    FROM users
    WHERE 1=1
  `;
    const params = [];

    if (keyword) {
        query += ` AND (username LIKE ? OR real_name LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 计数查询
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (keyword) {
        countQuery += ` AND (username LIKE ? OR real_name LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [countResult, users] = await Promise.all([
        dbGet(countQuery, countParams),
        dbAll(query, params)
    ]);

    return {
        list: users,
        total: countResult.total || 0
    };
}

/**
 * 根据角色查找用户
 * @param {Array<string>} roles - 角色数组
 * @returns {Promise<Array>}
 */
async function findByRoles(roles) {
    const placeholders = roles.map(() => '?').join(',');
    const users = await dbAll(
        `SELECT id FROM users WHERE role IN (${placeholders})`,
        roles
    );

    return users || [];
}

/**
 * 创建新用户
 * @param {Object} userData - 用户数据
 * @returns {Promise<{lastID: number}>}
 */
async function create(userData) {
    const { username, password, realName, role, email = null, phone = null } = userData;

    const result = await dbRun(
        `INSERT INTO users (username, password, real_name, role, email, phone) 
     VALUES (?, ?, ?, ?, ?, ?)`,
        [username, password, realName, role, email, phone]
    );

    return result;
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<{changes: number}>}
 */
async function update(id, updates) {
    const allowedFields = ['real_name', 'email', 'phone', 'role', 'avatar'];
    const updateFields = [];
    const params = [];

    Object.entries(updates).forEach(([key, value]) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (allowedFields.includes(snakeKey) && value !== undefined) {
            updateFields.push(`${snakeKey} = ?`);
            params.push(value);
        }
    });

    if (updateFields.length === 0) {
        throw new Error('没有要更新的字段');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await dbRun(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        params
    );

    return result;
}

/**
 * 更新用户密码
 * @param {number} id - 用户ID
 * @param {string} hashedPassword - 加密后的密码
 * @returns {Promise<{changes: number}>}
 */
async function updatePassword(id, hashedPassword) {
    const result = await dbRun(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id]
    );

    return result;
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise<{changes: number}>}
 */
async function deleteById(id) {
    const result = await dbRun('DELETE FROM users WHERE id = ?', [id]);
    return result;
}

module.exports = {
    findByUsername,
    findById,
    findAll,
    findByRoles,
    create,
    update,
    updatePassword,
    deleteById
};

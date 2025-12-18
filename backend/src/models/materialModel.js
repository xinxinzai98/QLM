const { dbGet, dbAll, dbRun } = require('../utils/dbHelper');

/**
 * 物料数据访问层 (Material Model)
 * 封装所有与 materials 表相关的数据库操作
 */

/**
 * 获取物料列表(支持分页和搜索)
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.keyword - 搜索关键词
 * @param {string} options.category - 物料类别
 * @returns {Promise<{list: Array, total: number}>}
 */
async function findAll({ page = 1, pageSize = 10, keyword = '', category = '' }) {
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 构建查询条件
    let query = `
    SELECT m.*, u.real_name as creator_name 
    FROM materials m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE 1=1
  `;
    const params = [];

    if (keyword) {
        query += ` AND (m.material_code LIKE ? OR m.material_name LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
        query += ` AND m.category = ?`;
        params.push(category);
    }

    query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 构建计数查询
    let countQuery = `
    SELECT COUNT(*) as total 
    FROM materials m
    WHERE 1=1
  `;
    const countParams = [];

    if (keyword) {
        countQuery += ` AND (m.material_code LIKE ? OR m.material_name LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
        countQuery += ` AND m.category = ?`;
        countParams.push(category);
    }

    // 并行执行查询，提升性能
    const [countResult, materials] = await Promise.all([
        dbGet(countQuery, countParams),
        dbAll(query, params)
    ]);

    return {
        list: materials,
        total: countResult.total || 0
    };
}

/**
 * 根据ID获取单个物料
 * @param {number} id - 物料ID
 * @returns {Promise<Object|null>}
 */
async function findById(id) {
    const material = await dbGet(
        `SELECT m.*, u.real_name as creator_name 
     FROM materials m
     LEFT JOIN users u ON m.created_by = u.id
     WHERE m.id = ?`,
        [id]
    );

    return (material && material.id) ? material : null;
}

/**
 * 根据物料编码查找物料（返回第一个匹配的物料）
 * 注意：编码不再唯一，可能返回多个物料中的第一个
 * @param {string} materialCode - 物料编码
 * @returns {Promise<Object|null>}
 */
async function findByCode(materialCode) {
    const material = await dbGet(
        'SELECT id FROM materials WHERE material_code = ? LIMIT 1',
        [materialCode]
    );

    return (material && material.id) ? material : null;
}

/**
 * 根据物料编码查找所有匹配的物料
 * @param {string} materialCode - 物料编码
 * @returns {Promise<Array>}
 */
async function findAllByCode(materialCode) {
    const materials = await dbAll(
        'SELECT * FROM materials WHERE material_code = ?',
        [materialCode]
    );

    return materials || [];
}

/**
 * 记录物料编码变更历史
 * @param {Object} historyData - 历史记录数据
 * @returns {Promise<{lastID: number}>}
 */
async function recordCodeChange(historyData) {
    const { materialId, oldCode, newCode, changedBy, changeReason } = historyData;

    const result = await dbRun(
        `INSERT INTO material_code_history 
         (material_id, old_code, new_code, changed_by, change_reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [materialId, oldCode || null, newCode, changedBy, changeReason || null]
    );

    return result;
}

/**
 * 创建新物料
 * @param {Object} materialData - 物料数据
 * @returns {Promise<{lastID: number}>}
 */
async function create(materialData) {
    const {
        materialCode,
        materialName,
        category,
        unit,
        minStock = 0,
        maxStock = 0,
        location = null,
        description = null,
        createdBy
    } = materialData;

    const result = await dbRun(
        `INSERT INTO materials 
     (material_code, material_name, category, unit, min_stock, max_stock, location, description, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            materialCode,
            materialName,
            category,
            unit,
            minStock,
            maxStock,
            location,
            description,
            createdBy
        ]
    );

    return result;
}

/**
 * 更新物料信息
 * @param {number} id - 物料ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<{changes: number}>}
 */
async function update(id, updates) {
    const allowedFields = [
        'material_code',
        'material_name',
        'category',
        'unit',
        'min_stock',
        'max_stock',
        'location',
        'description'
    ];

    const updateFields = [];
    const params = [];

    // 构建动态更新语句
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
        `UPDATE materials SET ${updateFields.join(', ')} WHERE id = ?`,
        params
    );

    return result;
}

/**
 * 删除物料
 * @param {number} id - 物料ID
 * @returns {Promise<{changes: number}>}
 */
async function deleteById(id) {
    const result = await dbRun('DELETE FROM materials WHERE id = ?', [id]);
    return result;
}

/**
 * 检查物料是否有相关出入库记录
 * @param {number} materialId - 物料ID
 * @returns {Promise<boolean>}
 */
async function hasInventoryTransactions(materialId) {
    const transaction = await dbGet(
        'SELECT id FROM inventory_transactions WHERE material_id = ? LIMIT 1',
        [materialId]
    );

    return !!(transaction && transaction.id);
}

module.exports = {
    findAll,
    findById,
    findByCode,
    findAllByCode,
    create,
    update,
    deleteById,
    hasInventoryTransactions,
    recordCodeChange
};

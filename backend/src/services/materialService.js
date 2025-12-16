const materialModel = require('../models/materialModel');
const operationLogModel = require('../models/operationLogModel');

/**
 * 物料业务逻辑层 (Material Service)
 * 处理物料相关的业务逻辑,调用Model层进行数据访问
 */

/**
 * 获取物料列表
 * @param {Object} query - 查询参数
 * @returns {Promise<{list: Array, total: number, page: number, pageSize: number}>}
 */
async function getMaterials(query) {
    const { page = 1, pageSize = 10, keyword = '', category = '' } = query;

    const result = await materialModel.findAll({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        keyword,
        category
    });

    return {
        list: result.list,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
    };
}

/**
 * 获取单个物料详情
 * @param {number} id - 物料ID
 * @returns {Promise<Object>}
 */
async function getMaterialById(id) {
    const material = await materialModel.findById(id);

    if (!material) {
        const error = new Error('物料不存在');
        error.status = 404;
        throw error;
    }

    return material;
}

/**
 * 创建物料
 * @param {Object} materialData - 物料数据
 * @param {Object} user - 当前用户
 * @returns {Promise<Object>}
 */
async function createMaterial(materialData, user) {
    const {
        materialCode,
        materialName,
        category,
        unit,
        minStock,
        maxStock,
        location,
        description
    } = materialData;

    // 验证必填字段
    if (!materialCode || !materialName || !category || !unit) {
        const error = new Error('物料编码、名称、类别和单位为必填项');
        error.status = 400;
        throw error;
    }

    // 验证类别
    if (!['chemical', 'metal'].includes(category)) {
        const error = new Error('物料类别必须是 chemical 或 metal');
        error.status = 400;
        throw error;
    }

    // 检查物料编码是否已存在
    const existingMaterial = await materialModel.findByCode(materialCode);
    if (existingMaterial) {
        const error = new Error('物料编码已存在');
        error.status = 400;
        throw error;
    }

    // 创建物料
    const result = await materialModel.create({
        materialCode,
        materialName,
        category,
        unit,
        minStock,
        maxStock,
        location,
        description,
        createdBy: user.id
    });

    // 记录操作日志
    await operationLogModel.create({
        userId: user.id,
        username: user.username,
        action: 'create',
        module: 'materials',
        targetType: 'material',
        targetId: result.lastID,
        details: `创建物料: ${materialName}`
    });

    return {
        id: result.lastID,
        materialCode,
        materialName
    };
}

/**
 * 更新物料
 * @param {number} id - 物料ID
 * @param {Object} updates - 更新数据
 * @param {Object} user - 当前用户
 * @returns {Promise<Object>}
 */
async function updateMaterial(id, updates, user) {
    // 检查物料是否存在
    const material = await materialModel.findById(id);
    if (!material) {
        const error = new Error('物料不存在');
        error.status = 404;
        throw error;
    }

    // 更新物料
    const result = await materialModel.update(id, updates);

    if (result.changes === 0) {
        const error = new Error('没有要更新的字段');
        error.status = 400;
        throw error;
    }

    // 记录操作日志
    await operationLogModel.create({
        userId: user.id,
        username: user.username,
        action: 'update',
        module: 'materials',
        targetType: 'material',
        targetId: id,
        details: '更新物料信息'
    });

    return { id };
}

/**
 * 删除物料
 * @param {number} id - 物料ID
 * @param {Object} user - 当前用户
 * @returns {Promise<void>}
 */
async function deleteMaterial(id, user) {
    // 检查物料是否存在
    const material = await materialModel.findById(id);
    if (!material) {
        const error = new Error('物料不存在');
        error.status = 404;
        throw error;
    }

    // 检查是否有相关的出入库单
    const hasTransactions = await materialModel.hasInventoryTransactions(id);
    if (hasTransactions) {
        const error = new Error('该物料存在相关出入库记录,无法删除');
        error.status = 400;
        throw error;
    }

    // 删除物料
    await materialModel.deleteById(id);

    // 记录操作日志
    await operationLogModel.create({
        userId: user.id,
        username: user.username,
        action: 'delete',
        module: 'materials',
        targetType: 'material',
        targetId: id,
        details: '删除物料'
    });
}

module.exports = {
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};

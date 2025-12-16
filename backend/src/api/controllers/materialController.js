const materialService = require('../../services/materialService');

/**
 * 物料控制器 (Material Controller)
 * 处理物料相关的HTTP请求和响应
 */

/**
 * 获取物料列表
 */
async function getMaterials(req, res, next) {
    try {
        const data = await materialService.getMaterials(req.query);
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 获取单个物料详情
 */
async function getMaterialById(req, res, next) {
    try {
        const { id } = req.params;
        const data = await materialService.getMaterialById(parseInt(id));
        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 创建物料
 */
async function createMaterial(req, res, next) {
    try {
        const data = await materialService.createMaterial(req.body, req.user);
        res.status(201).json({
            success: true,
            message: '物料创建成功',
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 更新物料
 */
async function updateMaterial(req, res, next) {
    try {
        const { id } = req.params;
        const data = await materialService.updateMaterial(parseInt(id), req.body, req.user);
        res.json({
            success: true,
            message: '物料更新成功',
            data
        });
    } catch (error) {
        next(error);
    }
}

/**
 * 删除物料
 */
async function deleteMaterial(req, res, next) {
    try {
        const { id } = req.params;
        await materialService.deleteMaterial(parseInt(id), req.user);
        res.json({
            success: true,
            message: '物料删除成功'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};

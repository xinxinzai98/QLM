-- 移除物料编码唯一约束的迁移脚本
-- 执行时间：2024-12-18
-- 说明：允许物料编码重复，但保留编码用于搜索和显示

-- 1. 删除唯一索引（如果存在）
DROP INDEX IF EXISTS idx_materials_code;

-- 2. 由于SQLite不支持直接修改列约束，需要重建表
-- 但为了数据安全，这里只删除索引，表定义中的UNIQUE约束会在新表创建时自动移除
-- 注意：在生产环境，应使用更安全的迁移方式（如创建新表并迁移数据）

-- 3. 创建普通索引（非唯一）以保持查询性能
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);


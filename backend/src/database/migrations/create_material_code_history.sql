-- 创建物料编码历史记录表
-- 执行时间：2024-12-18
-- 说明：记录物料编码的变更历史，用于追溯和审计

CREATE TABLE IF NOT EXISTS material_code_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL,
  old_code TEXT,
  new_code TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  change_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_material_code_history_material ON material_code_history(material_id);
CREATE INDEX IF NOT EXISTS idx_material_code_history_code ON material_code_history(new_code);
CREATE INDEX IF NOT EXISTS idx_material_code_history_created_at ON material_code_history(created_at DESC);


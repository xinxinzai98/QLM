# 📋 项目结构清理清单

## 📅 生成时间
2024-12-18

## 🎯 清理目标
优化项目结构，删除冗余文件，合并重复内容，提升项目可维护性。

---

## 一、重复文档文件（建议删除）

### 1.1 根目录重复文档
| 文件路径 | 重复位置 | 建议操作 | 原因 |
|---------|---------|---------|------|
| `deploy_ecs.md` | `docs/DEPLOY_ECS.md` | ✅ **删除根目录版本** | 内容完全相同，保留docs目录下的版本更规范 |
| `REPO_CLEANUP_PLAN.md` | 无 | ✅ **移动到归档** | 清理计划已执行，应归档到 `docs/_archive/` |

### 1.2 docs目录下的重复审查报告
| 文件路径 | 归档位置 | 建议操作 | 原因 |
|---------|---------|---------|------|
| `docs/REVIEW_REPORT_1_UI_FIXES.md` | `docs/_archive/reports/review-reports/REVIEW_REPORT_1_UI_FIXES.md` | ✅ **删除docs下版本** | 已在归档目录，保留归档版本即可 |
| `docs/REVIEW_REPORT_2_ERROR_ELIMINATION.md` | `docs/_archive/reports/review-reports/REVIEW_REPORT_2_ERROR_ELIMINATION.md` | ✅ **删除docs下版本** | 已在归档目录，保留归档版本即可 |
| `docs/REVIEW_REPORT_3_STRUCTURE_OPTIMIZATION.md` | `docs/_archive/reports/review-reports/REVIEW_REPORT_3_STRUCTURE_OPTIMIZATION.md` | ✅ **删除docs下版本** | 已在归档目录，保留归档版本即可 |

---

## 二、可能冗余的文档文件（需确认）

### 2.1 临时/说明文档
| 文件路径 | 建议操作 | 原因 | 状态 |
|---------|---------|------|------|
| `安装依赖说明.md` | ⚠️ **评估后决定** | 可能是临时文档，检查是否已在README或开发文档中说明 | 待确认 |
| `AUDIT_REPORT.md` | ⚠️ **评估后决定** | 检查是否为最新审计报告，或应归档 | 待确认 |

### 2.2 已归档的历史报告（保留）
| 位置 | 文件数量 | 状态 |
|------|---------|------|
| `docs/_archive/reports/` | ~30个文件 | ✅ **保留** | 历史文档已正确归档，应保留作为历史记录 |

---

## 三、配置文件检查

### 3.1 示例配置文件（保留）
| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `docker-compose.override.yml.example` | ✅ **保留** | 示例配置文件，用于指导用户配置 |

### 3.2 环境变量文件
| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `.env` | ✅ **保留**（已在.gitignore） | 环境变量文件 |
| `.env.example` | ⚠️ **检查是否存在** | 如果不存在，建议创建 |

---

## 四、工具函数重复检查

### 4.1 前端工具函数
| 文件路径 | 函数 | 状态 |
|---------|------|------|
| `frontend/src/utils/debounce.js` | debounce, throttle | ✅ **无重复** |
| `frontend/src/utils/errorHandler.js` | handleApiError | ✅ **无重复** |
| `frontend/src/utils/api.js` | API封装 | ✅ **无重复** |

### 4.2 后端工具函数
| 文件路径 | 函数 | 状态 |
|---------|------|------|
| `backend/src/utils/dbHelper.js` | dbGet, dbAll, dbRun | ✅ **无重复** |
| `backend/src/utils/notificationHelper.js` | 通知相关 | ✅ **无重复** |

**结论**：工具函数组织良好，无重复代码。

---

## 五、测试文件检查

### 5.1 测试文件
| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `scripts/integration_test.js` | ✅ **保留** | 集成测试脚本 |
| `scripts/smoke_test.js` | ✅ **保留** | 冒烟测试脚本 |
| `*.test.js` | ✅ **未找到** | 暂无单元测试文件 |
| `*.spec.js` | ✅ **未找到** | 暂无规范测试文件 |

**结论**：测试文件组织合理，无需清理。

---

## 六、建议的清理操作总结

### 🔴 确认删除（5个文件）

1. ✅ `deploy_ecs.md`（根目录）- 删除，保留 `docs/DEPLOY_ECS.md`
2. ✅ `docs/REVIEW_REPORT_1_UI_FIXES.md` - 删除，保留归档版本
3. ✅ `docs/REVIEW_REPORT_2_ERROR_ELIMINATION.md` - 删除，保留归档版本
4. ✅ `docs/REVIEW_REPORT_3_STRUCTURE_OPTIMIZATION.md` - 删除，保留归档版本
5. ✅ `REPO_CLEANUP_PLAN.md` - 移动到 `docs/_archive/` 或删除（已执行完成）

### ⚠️ 需要评估（2个文件）

1. ⚠️ `安装依赖说明.md` - 评估是否已合并到README或开发文档
2. ⚠️ `AUDIT_REPORT.md` - 评估是否为最新版本，或应归档

---

## 七、目录结构优化建议

### 7.1 当前结构评估
```
✅ 优点：
- docs目录结构清晰，已按功能分类
- 历史文档已归档到 _archive
- scripts目录组织良好
- 代码结构清晰，前后端分离

⚠️ 可优化：
- 根目录仍有部分重复文档
- 部分临时文档可能需归档
```

### 7.2 优化后的理想结构
```
QLM/
├── backend/              # 后端代码
├── frontend/             # 前端代码
├── docs/                 # 文档（只保留活跃文档）
│   ├── api/
│   ├── deployment/
│   ├── development/
│   ├── user-guide/
│   ├── _archive/         # 历史文档归档
│   └── [核心文档].md
├── scripts/              # 脚本文件
├── ops/                  # 运维配置
├── [配置文件]            # Docker相关配置
└── README.md            # 项目主文档
```

---

## 八、执行步骤

### 步骤1：确认删除文件
- [ ] 确认上述5个文件的删除操作
- [ ] 评估2个待确认文件的处理方式

### 步骤2：执行清理
- [ ] 删除重复文档
- [ ] 移动/归档计划文档
- [ ] 更新文档索引和链接

### 步骤3：验证
- [ ] 检查README.md中的链接是否正常
- [ ] 检查docs/INDEX.md是否需更新
- [ ] 确认所有关键文档可访问

---

## 九、风险评估

### 低风险 ✅
- 删除重复文档（已有备份在归档目录）
- 删除根目录的deploy_ecs.md（docs下有相同内容）

### 中风险 ⚠️
- 删除审查报告（需确认是否有外部链接引用）

### 建议
1. 先备份要删除的文件
2. 执行删除后立即提交到git
3. 如有问题可以快速恢复

---

## 📝 下一步

请确认以上清理清单，确认后我将：
1. 执行文件删除/移动操作
2. 更新相关文档索引
3. 更新README.md中的链接
4. 生成清理报告


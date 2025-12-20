# 测试说明

## 运行测试

### 单元测试（推荐）

单元测试不依赖外部环境，可以立即运行：

```bash
cd backend
npm run test:unit
```

**预期结果**：所有单元测试通过 ✅

### 集成测试

集成测试需要完整的数据库环境，需要先配置：

#### 1. 设置测试环境变量

```bash
# Windows PowerShell
$env:NODE_ENV="test"
$env:DB_PATH="./database/mms_test.db"
$env:JWT_SECRET="test-jwt-secret-key-for-testing-only"
```

#### 2. 初始化测试数据库

集成测试会在测试时自动创建数据库表，但确保目录存在：

```bash
mkdir -p data/test/database
mkdir -p data/test/uploads
```

#### 3. 运行集成测试

```bash
npm run test:integration
```

**注意**：
- 集成测试会创建和删除测试数据
- 确保使用独立的测试数据库文件
- 测试可能会修改数据库结构

### 运行所有测试

```bash
npm test
```

这会运行所有测试（单元测试 + 集成测试）并生成覆盖率报告。

---

## 测试结构

```
__tests__/
├── unit/                    # 单元测试
│   ├── stockCalculator.test.js
│   ├── dateTimeHelper.test.js
│   ├── permissionHelper.test.js
│   └── materialService.test.js
└── integration/             # 集成测试
    ├── inventory.test.js
    ├── stocktaking.test.js
    └── permission.test.js
```

---

## 测试覆盖率

运行 `npm test` 后，覆盖率报告位于：
- HTML报告：`coverage/lcov-report/index.html`
- 文本报告：控制台输出

当前覆盖率（仅单元测试）：
- 工具函数：100%
- 物料服务层：~70%

---

## 故障排除

### 问题：集成测试失败

**原因**：集成测试需要真实的数据库环境。

**解决方案**：
1. 确保数据库目录存在
2. 检查数据库文件权限
3. 查看测试错误信息，可能是数据库连接问题

### 问题：Jest 命令未找到

**原因**：依赖未安装。

**解决方案**：
```bash
cd backend
npm install
```

### 问题：测试超时

**原因**：数据库操作较慢或阻塞。

**解决方案**：
- 检查数据库文件是否被其他进程锁定
- 增加测试超时时间（在 `jest.config.js` 中）

---

## 最佳实践

1. **开发时**：优先运行单元测试（快速反馈）
2. **提交前**：运行所有测试确保完整性
3. **CI/CD**：在持续集成中自动运行所有测试
4. **覆盖率**：保持关键业务逻辑的高覆盖率


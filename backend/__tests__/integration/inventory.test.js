/**
 * 出入库流程集成测试
 * 需要真实的数据库环境
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../../src/database/database');

// 注意：这是一个集成测试示例，实际运行需要：
// 1. 测试数据库环境
// 2. 测试数据准备
// 3. 测试后清理

describe('出入库流程集成测试', () => {
  let app;
  let testUser;
  let testMaterial;
  let authToken;

  beforeAll(async () => {
    // 初始化测试数据库
    app = require('../../src/app');
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password, role, real_name) 
         VALUES (?, ?, ?, ?)`,
        ['testuser', hashedPassword, 'inventory_manager', '测试用户'],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });
    testUser = { id: userResult.lastID, username: 'testuser', role: 'inventory_manager' };

    // 生成测试Token
    authToken = jwt.sign(
      { id: testUser.id, username: testUser.username, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // 创建测试物料
    const materialResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO materials (material_code, material_name, category, unit, current_stock, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['TEST001', '测试物料', 'chemical', 'kg', 100, testUser.id],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });
    testMaterial = { id: materialResult.lastID };
  });

  afterAll(async () => {
    // 清理测试数据
    await new Promise((resolve) => {
      db.run('DELETE FROM inventory_transactions WHERE applicant_id = ?', [testUser.id], () => {
        db.run('DELETE FROM materials WHERE id = ?', [testMaterial.id], () => {
          db.run('DELETE FROM users WHERE id = ?', [testUser.id], resolve);
        });
      });
    });
  });

  describe('创建入库单', () => {
    test('应该成功创建入库单', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionType: 'in',
          materialId: testMaterial.id,
          quantity: 50,
          unitPrice: 10.5,
          remark: '测试入库'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('transactionCode');
      expect(response.body.data.status).toBe('pending');
    });

    test('应该检查库存不足（出库时）', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionType: 'out',
          materialId: testMaterial.id,
          quantity: 200, // 超过当前库存
          remark: '测试出库'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('库存不足');
    });
  });

  describe('审批流程', () => {
    let transactionId;

    beforeEach(async () => {
      // 创建一个待审批的单据
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO inventory_transactions 
           (transaction_code, transaction_type, material_id, quantity, applicant_id, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['TEST001', 'in', testMaterial.id, 30, testUser.id, 'pending'],
          function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID });
          }
        );
      });
      transactionId = result.lastID;
    });

    afterEach(async () => {
      // 清理创建的测试单据
      await new Promise((resolve) => {
        db.run('DELETE FROM inventory_transactions WHERE id = ?', [transactionId], resolve);
      });
    });

    test('应该成功审批入库单', async () => {
      const response = await request(app)
        .put(`/api/inventory/${transactionId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action: 'approve',
          remark: '审批通过'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });

    test('应该更新物料库存', async () => {
      // 先审批单据
      await request(app)
        .put(`/api/inventory/${transactionId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'approve' });

      // 检查物料库存是否更新
      const material = await new Promise((resolve, reject) => {
        db.get('SELECT current_stock FROM materials WHERE id = ?', [testMaterial.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      expect(material.current_stock).toBe(130); // 100 + 30
    });
  });
});


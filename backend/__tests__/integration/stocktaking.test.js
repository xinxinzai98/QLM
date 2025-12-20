/**
 * 盘点功能集成测试
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../../src/database/database');

describe('盘点功能集成测试', () => {
  let app;
  let testUser;
  let testMaterials = [];
  let authToken;

  beforeAll(async () => {
    app = require('../../src/app');
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password, role, real_name) 
         VALUES (?, ?, ?, ?)`,
        ['stocktaking_user', hashedPassword, 'inventory_manager', '盘点测试用户'],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });
    testUser = { id: userResult.lastID, username: 'stocktaking_user', role: 'inventory_manager' };

    // 生成测试Token
    authToken = jwt.sign(
      { id: testUser.id, username: testUser.username, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // 创建测试物料
    for (let i = 0; i < 3; i++) {
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO materials (material_code, material_name, category, unit, current_stock, created_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`STOCK${i}`, `测试物料${i}`, 'chemical', 'kg', 100 + i * 10, testUser.id],
          function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID });
          }
        );
      });
      testMaterials.push({ id: result.lastID });
    }
  });

  afterAll(async () => {
    // 清理测试数据
    await new Promise((resolve) => {
      db.run('DELETE FROM stocktaking_items WHERE task_id IN (SELECT id FROM stocktaking_tasks WHERE creator_id = ?)', [testUser.id], () => {
        db.run('DELETE FROM stocktaking_tasks WHERE creator_id = ?', [testUser.id], () => {
          testMaterials.forEach(material => {
            db.run('DELETE FROM materials WHERE id = ?', [material.id]);
          });
          db.run('DELETE FROM users WHERE id = ?', [testUser.id], resolve);
        });
      });
    });
  });

  describe('创建盘点任务', () => {
    test('应该成功创建盘点任务', async () => {
      const materialIds = testMaterials.map(m => m.id);
      
      const response = await request(app)
        .post('/api/stocktaking')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskName: '测试盘点任务',
          startDate: '2024-12-18',
          endDate: '2024-12-25',
          materialIds: materialIds,
          remark: '集成测试'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('taskCode');
      expect(response.body.data.status).toBe('draft');
    });

    test('应该验证物料列表', async () => {
      const response = await request(app)
        .post('/api/stocktaking')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskName: '测试盘点任务2',
          materialIds: [] // 空列表
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('盘点任务执行', () => {
    let taskId;

    beforeEach(async () => {
      // 创建测试盘点任务
      const taskResult = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO stocktaking_tasks (task_code, task_name, creator_id, status)
           VALUES (?, ?, ?, ?)`,
          ['TEST001', '测试任务', testUser.id, 'draft'],
          function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID });
          }
        );
      });
      taskId = taskResult.lastID;

      // 创建盘点明细
      for (const material of testMaterials) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO stocktaking_items (task_id, material_id, book_stock)
             VALUES (?, ?, ?)`,
            [taskId, material.id, 100],
            (err) => err ? reject(err) : resolve()
          );
        });
      }
    });

    afterEach(async () => {
      await new Promise((resolve) => {
        db.run('DELETE FROM stocktaking_items WHERE task_id = ?', [taskId], () => {
          db.run('DELETE FROM stocktaking_tasks WHERE id = ?', [taskId], resolve);
        });
      });
    });

    test('应该更新实际库存', async () => {
      const itemResult = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM stocktaking_items WHERE task_id = ? LIMIT 1',
          [taskId],
          (err, row) => err ? reject(err) : resolve(row)
        );
      });

      const response = await request(app)
        .put(`/api/stocktaking/${taskId}/items/${itemResult.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actualStock: 105,
          remark: '实际盘点数量'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});


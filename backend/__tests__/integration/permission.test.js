/**
 * 用户权限切换测试
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../../src/database/database');

describe('用户权限切换测试', () => {
  let app;
  let regularUser;
  let managerUser;
  let adminUser;
  let regularToken;
  let managerToken;
  let adminToken;

  beforeAll(async () => {
    app = require('../../src/app');
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';

    // 创建普通用户
    const regularResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password, role, real_name) 
         VALUES (?, ?, ?, ?)`,
        ['regular', hashedPassword, 'regular_user', '普通用户'],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });
    regularUser = { id: regularResult.lastID, username: 'regular', role: 'regular_user' };
    regularToken = jwt.sign(
      { id: regularUser.id, username: regularUser.username, role: regularUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 创建库存管理员
    const managerResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password, role, real_name) 
         VALUES (?, ?, ?, ?)`,
        ['manager', hashedPassword, 'inventory_manager', '库存管理员'],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });
    managerUser = { id: managerResult.lastID, username: 'manager', role: 'inventory_manager' };
    managerToken = jwt.sign(
      { id: managerUser.id, username: managerUser.username, role: managerUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 创建系统管理员
    const adminResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password, role, real_name) 
         VALUES (?, ?, ?, ?)`,
        ['admin', hashedPassword, 'system_admin', '系统管理员'],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });
    adminUser = { id: adminResult.lastID, username: 'admin', role: 'system_admin' };
    adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, role: adminUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      db.run('DELETE FROM users WHERE id IN (?, ?, ?)', 
        [regularUser.id, managerUser.id, adminUser.id], resolve);
    });
  });

  describe('物料管理权限', () => {
    test('系统管理员应该可以创建物料', async () => {
      const response = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          materialCode: 'PERM001',
          materialName: '权限测试物料',
          category: 'chemical',
          unit: 'kg'
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.success) {
        // 清理测试数据
        const materialId = response.body.data?.id;
        if (materialId) {
          await new Promise((resolve) => {
            db.run('DELETE FROM materials WHERE id = ?', [materialId], resolve);
          });
        }
      }
    });

    test('库存管理员应该可以创建物料', async () => {
      const response = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          materialCode: 'PERM002',
          materialName: '权限测试物料2',
          category: 'chemical',
          unit: 'kg'
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.success) {
        const materialId = response.body.data?.id;
        if (materialId) {
          await new Promise((resolve) => {
            db.run('DELETE FROM materials WHERE id = ?', [materialId], resolve);
          });
        }
      }
    });

    test('普通用户不应该可以创建物料', async () => {
      const response = await request(app)
        .post('/api/materials')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          materialCode: 'PERM003',
          materialName: '权限测试物料3',
          category: 'chemical',
          unit: 'kg'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });
  });

  describe('用户管理权限', () => {
    test('系统管理员应该可以查看用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('普通用户不应该可以查看用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});


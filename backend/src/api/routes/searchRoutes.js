/**
 * 全局搜索路由
 * 支持搜索物料、用户、出入库单
 */

const express = require('express');
const router = express.Router();
const db = require('../../database/database');
const { authenticateToken } = require('../../middleware/authMiddleware');

// 所有路由都需要认证
router.use(authenticateToken);

// 全局搜索
router.get('/', (req, res, next) => {
  try {
    const { q = '', type } = req.query;
    
    if (!q.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const keyword = `%${q}%`;
    const results = [];

    // 搜索物料
    if (!type || type === 'materials' || type === 'all') {
      db.all(
        `SELECT 
          id,
          material_code as code,
          material_name as name,
          'material' as type,
          material_code || ' - ' || material_name as title,
          category || ' | ' || unit as description
        FROM materials
        WHERE material_code LIKE ? OR material_name LIKE ?
        LIMIT 10`,
        [keyword, keyword],
        (err, materials) => {
          if (err) {
            return next(err);
          }
          
          if (materials) {
            results.push(...materials);
          }

          // 搜索用户
          if (!type || type === 'users' || type === 'all') {
            db.all(
              `SELECT 
                id,
                username as code,
                real_name as name,
                'user' as type,
                COALESCE(real_name, username) as title,
                username || ' | ' || COALESCE(email, '') as description
              FROM users
              WHERE username LIKE ? OR real_name LIKE ? OR email LIKE ?
              LIMIT 10`,
              [keyword, keyword, keyword],
              (err, users) => {
                if (err) {
                  return next(err);
                }
                
                if (users) {
                  results.push(...users);
                }

                // 搜索出入库单
                if (!type || type === 'transactions' || type === 'all') {
                  db.all(
                    `SELECT 
                      it.id,
                      it.transaction_code as code,
                      m.material_name as name,
                      'transaction' as type,
                      it.transaction_code || ' - ' || m.material_name as title,
                      CASE 
                        WHEN it.transaction_type = 'in' THEN '入库'
                        ELSE '出库'
                      END || ' | ' || it.quantity || ' ' || m.unit as description
                    FROM inventory_transactions it
                    LEFT JOIN materials m ON it.material_id = m.id
                    WHERE it.transaction_code LIKE ? OR m.material_name LIKE ?
                    LIMIT 10`,
                    [keyword, keyword],
                    (err, transactions) => {
                      if (err) {
                        return next(err);
                      }
                      
                      if (transactions) {
                        results.push(...transactions);
                      }

                      // 返回结果
                      res.json({
                        success: true,
                        data: results
                      });
                    }
                  );
                } else {
                  res.json({
                    success: true,
                    data: results
                  });
                }
              }
            );
          } else {
            res.json({
              success: true,
              data: results
            });
          }
        }
      );
    } else {
      // 只搜索指定类型
      if (type === 'materials') {
        db.all(
          `SELECT 
            id,
            material_code as code,
            material_name as name,
            'material' as type,
            material_code || ' - ' || material_name as title,
            category || ' | ' || unit as description
          FROM materials
          WHERE material_code LIKE ? OR material_name LIKE ?
          LIMIT 10`,
          [keyword, keyword],
          (err, materials) => {
            if (err) return next(err);
            res.json({
              success: true,
              data: materials || []
            });
          }
        );
      } else if (type === 'users') {
        db.all(
          `SELECT 
            id,
            username as code,
            real_name as name,
            'user' as type,
            COALESCE(real_name, username) as title,
            username || ' | ' || COALESCE(email, '') as description
          FROM users
          WHERE username LIKE ? OR real_name LIKE ? OR email LIKE ?
          LIMIT 10`,
          [keyword, keyword, keyword],
          (err, users) => {
            if (err) return next(err);
            res.json({
              success: true,
              data: users || []
            });
          }
        );
      } else if (type === 'transactions') {
        db.all(
          `SELECT 
            it.id,
            it.transaction_code as code,
            m.material_name as name,
            'transaction' as type,
            it.transaction_code || ' - ' || m.material_name as title,
            CASE 
              WHEN it.transaction_type = 'in' THEN '入库'
              ELSE '出库'
            END || ' | ' || it.quantity || ' ' || m.unit as description
          FROM inventory_transactions it
          LEFT JOIN materials m ON it.material_id = m.id
          WHERE it.transaction_code LIKE ? OR m.material_name LIKE ?
          LIMIT 10`,
          [keyword, keyword],
          (err, transactions) => {
            if (err) return next(err);
            res.json({
              success: true,
              data: transactions || []
            });
          }
        );
      } else {
        res.json({
          success: true,
          data: []
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;






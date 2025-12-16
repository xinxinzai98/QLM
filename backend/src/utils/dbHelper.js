/**
 * 数据库查询辅助工具
 * 将SQLite回调式API包装为Promise，便于使用async/await
 */

const { db } = require('../database/database');

/**
 * 执行查询并返回单行结果（Promise包装）
 * @param {string} sql - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 */
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || {});
      }
    });
  });
};

/**
 * 执行查询并返回多行结果（Promise包装）
 * @param {string} sql - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Array>} 查询结果数组
 */
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * 执行更新/插入/删除操作（Promise包装）
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Promise<Object>} { lastID, changes }
 */
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

module.exports = {
  dbGet,
  dbAll,
  dbRun
};






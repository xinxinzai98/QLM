const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'mms.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到SQLite数据库');
  }
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 初始化数据库表结构
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 先检查users表是否存在，如果存在则检查新增字段
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, table) => {
        if (!err && table) {
          // 表已存在，检查字段
          db.all("PRAGMA table_info(users)", (err, columns) => {
            if (!err && columns && Array.isArray(columns)) {
              const columnNames = columns.map(col => col.name);
              
              // 检查并添加avatar字段（如果不存在）
              if (!columnNames.includes('avatar')) {
                db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (alterErr) => {
                  if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.error('添加avatar字段失败:', alterErr);
                  }
                });
              }
              
              // 检查并添加refresh_token字段（如果不存在）
              if (!columnNames.includes('refresh_token')) {
                db.run(`ALTER TABLE users ADD COLUMN refresh_token TEXT`, (alterErr) => {
                  if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.error('添加refresh_token字段失败:', alterErr);
                  }
                });
              }
              
              // 检查并添加refresh_token_expires_at字段（如果不存在）
              if (!columnNames.includes('refresh_token_expires_at')) {
                db.run(`ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME`, (alterErr) => {
                  if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.error('添加refresh_token_expires_at字段失败:', alterErr);
                  }
                });
              }
            }
          });
        }
      });
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('system_admin', 'inventory_manager', 'regular_user')),
          real_name TEXT,
          email TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('创建用户表失败:', err);
        } else {
          // 检查并添加新增字段（如果表已存在但字段不存在）
          db.all("PRAGMA table_info(users)", (err, columns) => {
            if (!err && columns && Array.isArray(columns)) {
              const columnNames = columns.map(col => col.name);
              
              if (!columnNames.includes('avatar')) {
                db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (alterErr) => {
                  if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.error('添加avatar字段失败:', alterErr);
                  }
                });
              }
              
              if (!columnNames.includes('refresh_token')) {
                db.run(`ALTER TABLE users ADD COLUMN refresh_token TEXT`, (alterErr) => {
                  if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.error('添加refresh_token字段失败:', alterErr);
                  }
                });
              }
              
              if (!columnNames.includes('refresh_token_expires_at')) {
                db.run(`ALTER TABLE users ADD COLUMN refresh_token_expires_at DATETIME`, (alterErr) => {
                  if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.error('添加refresh_token_expires_at字段失败:', alterErr);
                  }
                });
              }
            }
          });
        }
      });

      // 物料表（material_code_history表依赖此表，需先创建）
      db.run(`
        CREATE TABLE IF NOT EXISTS materials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          material_code TEXT NOT NULL,
          material_name TEXT NOT NULL,
          category TEXT NOT NULL CHECK(category IN ('chemical', 'metal')),
          unit TEXT NOT NULL,
          current_stock REAL DEFAULT 0,
          min_stock REAL DEFAULT 0,
          max_stock REAL DEFAULT 0,
          location TEXT,
          description TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // 物料编码历史表（必须在materials表之后创建）
      db.run(`
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
        )
      `);

      // 出入库单表
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_code TEXT UNIQUE NOT NULL,
          transaction_type TEXT NOT NULL CHECK(transaction_type IN ('in', 'out')),
          material_id INTEGER NOT NULL,
          quantity REAL NOT NULL,
          unit_price REAL,
          total_amount REAL,
          applicant_id INTEGER NOT NULL,
          approver_id INTEGER,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
          remark TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          approved_at DATETIME,
          FOREIGN KEY (material_id) REFERENCES materials(id),
          FOREIGN KEY (applicant_id) REFERENCES users(id),
          FOREIGN KEY (approver_id) REFERENCES users(id)
        )
      `);

      // 库存变更历史表
      db.run(`
        CREATE TABLE IF NOT EXISTS stock_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          material_id INTEGER NOT NULL,
          transaction_id INTEGER,
          change_type TEXT NOT NULL CHECK(change_type IN ('in', 'out', 'adjust')),
          quantity_change REAL NOT NULL,
          stock_before REAL NOT NULL,
          stock_after REAL NOT NULL,
          operator_id INTEGER,
          remark TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (material_id) REFERENCES materials(id),
          FOREIGN KEY (transaction_id) REFERENCES inventory_transactions(id),
          FOREIGN KEY (operator_id) REFERENCES users(id)
        )
      `);

      // 物料盘点任务表
      db.run(`
        CREATE TABLE IF NOT EXISTS stocktaking_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_code TEXT UNIQUE NOT NULL,
          task_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'in_progress', 'completed', 'cancelled')),
          start_date DATE,
          end_date DATE,
          creator_id INTEGER NOT NULL,
          completed_by INTEGER,
          completed_at DATETIME,
          remark TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id),
          FOREIGN KEY (completed_by) REFERENCES users(id)
        )
      `);

      // 物料盘点明细表
      db.run(`
        CREATE TABLE IF NOT EXISTS stocktaking_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          material_id INTEGER NOT NULL,
          book_stock REAL NOT NULL,
          actual_stock REAL,
          difference REAL DEFAULT 0,
          difference_type TEXT CHECK(difference_type IN ('surplus', 'shortage', 'normal')),
          remark TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES stocktaking_tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (material_id) REFERENCES materials(id)
        )
      `);

      // 操作日志表
      db.run(`
        CREATE TABLE IF NOT EXISTS operation_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          module TEXT NOT NULL,
          action TEXT NOT NULL,
          resource_type TEXT,
          resource_id INTEGER,
          description TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // 通知消息表
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          type TEXT NOT NULL CHECK(type IN ('system', 'todo', 'announcement')),
          title TEXT NOT NULL,
          content TEXT,
          link TEXT,
          link_type TEXT CHECK(link_type IN ('transaction', 'material', 'user', 'stocktaking', 'url')),
          is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          read_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // SQLite自动提交，无需手动COMMIT
      resolve();
    });
  });
};

// 创建默认管理员账户（如果不存在）
const createDefaultAdmin = () => {
  return new Promise((resolve, reject) => {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        db.run(
          `INSERT INTO users (username, password, role, real_name, email) 
           VALUES (?, ?, ?, ?, ?)`,
          ['admin', defaultPassword, 'system_admin', '系统管理员', 'admin@mms.com'],
          function(err) {
            if (err) {
              reject(err);
            } else {
              console.log('默认管理员账户已创建: admin / admin123');
              resolve();
            }
          }
        );
      } else {
        resolve();
      }
    });
  });
};

// 创建数据库索引
const createIndexes = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表索引
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)', (err) => {
        if (err) console.error('创建用户表索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)', (err) => {
        if (err) console.error('创建用户角色索引失败:', err);
      });

      // 物料表索引（非唯一，允许编码重复）
      db.run('CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code)', (err) => {
        if (err) console.error('创建物料编码索引失败:', err);
      });

      // 物料编码历史表索引
      db.run('CREATE INDEX IF NOT EXISTS idx_material_code_history_material ON material_code_history(material_id)', (err) => {
        if (err) console.error('创建物料编码历史物料索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_material_code_history_code ON material_code_history(new_code)', (err) => {
        if (err) console.error('创建物料编码历史编码索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_material_code_history_created_at ON material_code_history(created_at DESC)', (err) => {
        if (err) console.error('创建物料编码历史创建时间索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category)', (err) => {
        if (err) console.error('创建物料类别索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at DESC)', (err) => {
        if (err) console.error('创建物料创建时间索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_materials_created_by ON materials(created_by)', (err) => {
        if (err) console.error('创建物料创建人索引失败:', err);
      });

      // 出入库单表索引
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_code ON inventory_transactions(transaction_code)', (err) => {
        if (err) console.error('创建出入库单号索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_status ON inventory_transactions(status)', (err) => {
        if (err) console.error('创建出入库单状态索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type)', (err) => {
        if (err) console.error('创建出入库单类型索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_applicant ON inventory_transactions(applicant_id)', (err) => {
        if (err) console.error('创建出入库单申请人索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_material ON inventory_transactions(material_id)', (err) => {
        if (err) console.error('创建出入库单物料索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON inventory_transactions(created_at DESC)', (err) => {
        if (err) console.error('创建出入库单创建时间索引失败:', err);
      });

      // 库存历史表索引
      db.run('CREATE INDEX IF NOT EXISTS idx_stock_history_material ON stock_history(material_id)', (err) => {
        if (err) console.error('创建库存历史物料索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC)', (err) => {
        if (err) console.error('创建库存历史创建时间索引失败:', err);
      });

      // 操作日志表索引
      db.run('CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id)', (err) => {
        if (err) console.error('创建操作日志用户索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC)', (err) => {
        if (err) console.error('创建操作日志创建时间索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_operation_logs_module ON operation_logs(module, action)', (err) => {
        if (err) console.error('创建操作日志模块索引失败:', err);
      });

      // 盘点任务表索引
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_stocktaking_tasks_code ON stocktaking_tasks(task_code)', (err) => {
        if (err) console.error('创建盘点任务编码索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_stocktaking_tasks_status ON stocktaking_tasks(status)', (err) => {
        if (err) console.error('创建盘点任务状态索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_stocktaking_tasks_creator ON stocktaking_tasks(creator_id)', (err) => {
        if (err) console.error('创建盘点任务创建人索引失败:', err);
      });

      // 盘点明细表索引
      db.run('CREATE INDEX IF NOT EXISTS idx_stocktaking_items_task ON stocktaking_items(task_id)', (err) => {
        if (err) console.error('创建盘点明细任务索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_stocktaking_items_material ON stocktaking_items(material_id)', (err) => {
        if (err) console.error('创建盘点明细物料索引失败:', err);
      });

      // 通知消息表索引
      db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)', (err) => {
        if (err) console.error('创建通知用户索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)', (err) => {
        if (err) console.error('创建通知已读索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)', (err) => {
        if (err) console.error('创建通知创建时间索引失败:', err);
      });
      db.run('CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)', (err) => {
        if (err) console.error('创建通知类型索引失败:', err);
      });

      // SQLite的serialize()确保所有操作顺序执行
      // 使用一个简单的查询来确保所有操作完成
      db.get('SELECT 1', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('数据库索引创建完成');
          resolve();
        }
      });
    });
  });
};

// 初始化数据库
const init = async () => {
  try {
    await initializeDatabase();
    await createIndexes();
    await createDefaultAdmin();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

module.exports = {
  db,
  init
};


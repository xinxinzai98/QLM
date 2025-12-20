const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const db = require('../../database/database').db;
const { dbAll } = require('../../utils/dbHelper');
const fs = require('fs');
const path = require('path');
const { getClientIP, getUserAgent } = require('../../utils/requestHelper');

// 所有路由都需要认证且仅系统管理员可访问
router.use(authenticateToken);
router.use(checkRole('system_admin'));

// 数据库表列表（业务表，排除系统表）
const BUSINESS_TABLES = [
  'users',
  'materials',
  'material_code_history',
  'inventory_transactions',
  'stocktaking_records',
  'stocktaking_items',
  'operation_logs',
  'notifications'
];

/**
 * GET /api/admin/database/tables
 * 获取数据库表列表
 */
router.get('/tables', (req, res, next) => {
  try {
    const query = `
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    db.all(query, [], (err, tables) => {
      if (err) {
        return next(err);
      }

      // 标记是否为业务表
      const tableList = tables.map(table => ({
        name: table.name,
        isBusinessTable: BUSINESS_TABLES.includes(table.name)
      }));

      res.json({
        success: true,
        data: tableList
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/database/table/:tableName
 * 获取指定表的数据（支持分页和查询）
 */
router.get('/table/:tableName', (req, res, next) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50, orderBy = 'id', order = 'ASC' } = req.query;

    // 验证表名（防止SQL注入）
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        message: '无效的表名'
      });
    }

    // 验证orderBy（防止SQL注入）
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(orderBy)) {
      return res.status(400).json({
        success: false,
        message: '无效的排序字段'
      });
    }

    // 验证order
    const validOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 获取表结构（列信息）
    const structureQuery = `PRAGMA table_info(${tableName})`;
    
    db.all(structureQuery, [], (err, columns) => {
      if (err) {
        return res.status(404).json({
          success: false,
          message: '表不存在或无法访问'
        });
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
      
      db.get(countQuery, [], (err, countResult) => {
        if (err) {
          return next(err);
        }

        // 获取数据（使用参数化查询防止SQL注入）
        // 注意：表名和列名不能参数化，所以需要严格验证
        const dataQuery = `SELECT * FROM ${tableName} ORDER BY ${orderBy} ${validOrder} LIMIT ? OFFSET ?`;
        
        db.all(dataQuery, [limit, offset], (err, rows) => {
          if (err) {
            return next(err);
          }

          res.json({
            success: true,
            data: {
              tableName,
              columns: columns.map(col => ({
                name: col.name,
                type: col.type,
                notnull: col.notnull,
                pk: col.pk
              })),
              rows,
              pagination: {
                total: countResult.total,
                page: parseInt(page),
                pageSize: limit,
                totalPages: Math.ceil(countResult.total / limit)
              }
            }
          });
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/database/table/:tableName/row/:id
 * 更新指定表的指定行
 */
router.put('/table/:tableName/row/:id', (req, res, next) => {
  try {
    const { tableName, id } = req.params;
    const updateData = req.body;

    // 验证表名
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        message: '无效的表名'
      });
    }

    // 验证ID
    const rowId = parseInt(id);
    if (isNaN(rowId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID'
      });
    }

    // 先获取表结构，验证字段
    const structureQuery = `PRAGMA table_info(${tableName})`;
    
    db.all(structureQuery, [], (err, columns) => {
      if (err) {
        return res.status(404).json({
          success: false,
          message: '表不存在或无法访问'
        });
      }

      const columnNames = columns.map(col => col.name);
      const primaryKeyColumn = columns.find(col => col.pk)?.name || 'id';

      // 验证更新字段是否存在于表中
      const updateFields = Object.keys(updateData);
      const invalidFields = updateFields.filter(field => !columnNames.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的字段: ${invalidFields.join(', ')}`
        });
      }

      // 过滤掉主键字段（不允许更新主键）
      const allowedFields = updateFields.filter(field => field !== primaryKeyColumn);
      
      if (allowedFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有可更新的字段'
        });
      }

      // 构建UPDATE语句（使用参数化查询）
      const setClause = allowedFields.map(field => `${field} = ?`).join(', ');
      const values = allowedFields.map(field => updateData[field]);
      values.push(rowId); // 添加到WHERE条件中

      const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${primaryKeyColumn} = ?`;

      db.run(updateQuery, values, function(err) {
        if (err) {
          return next(err);
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: '记录不存在'
          });
        }

        // 记录操作日志
        const operationLogModel = require('../../models/operationLogModel');
        operationLogModel.create({
          user_id: req.user.id,
          module: 'admin_data_management',
          action: 'update',
          resource_type: tableName,
          resource_id: rowId,
          description: `更新${tableName}表记录 #${rowId}`,
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req)
        }).catch(err => {
          console.error('记录操作日志失败:', err);
        });

        res.json({
          success: true,
          message: '更新成功',
          data: {
            id: rowId,
            changes: this.changes
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/database/table/:tableName/row/:id
 * 删除指定表的指定行
 */
router.delete('/table/:tableName/row/:id', (req, res, next) => {
  try {
    const { tableName, id } = req.params;

    // 验证表名
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        message: '无效的表名'
      });
    }

    // 验证ID
    const rowId = parseInt(id);
    if (isNaN(rowId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID'
      });
    }

    // 检查是否为关键业务表（防止误删）
    const criticalTables = ['users'];
    if (criticalTables.includes(tableName)) {
      return res.status(403).json({
        success: false,
        message: '不允许删除关键业务表的数据，请使用相应的管理功能'
      });
    }

    // 先获取表结构，确定主键
    const structureQuery = `PRAGMA table_info(${tableName})`;
    
    db.all(structureQuery, [], (err, columns) => {
      if (err) {
        return res.status(404).json({
          success: false,
          message: '表不存在或无法访问'
        });
      }

      const primaryKeyColumn = columns.find(col => col.pk)?.name || 'id';
      const deleteQuery = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn} = ?`;

      db.run(deleteQuery, [rowId], function(err) {
        if (err) {
          return next(err);
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: '记录不存在'
          });
        }

        // 记录操作日志
        const operationLogModel = require('../../models/operationLogModel');
        operationLogModel.create({
          user_id: req.user.id,
          module: 'admin_data_management',
          action: 'delete',
          resource_type: tableName,
          resource_id: rowId,
          description: `删除${tableName}表记录 #${rowId}`,
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req)
        }).catch(err => {
          console.error('记录操作日志失败:', err);
        });

        res.json({
          success: true,
          message: '删除成功',
          data: {
            id: rowId,
            changes: this.changes
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/database/export
 * 导出数据库为SQL文件
 */
router.post('/export', (req, res, next) => {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/mms.db');
    
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        success: false,
        message: '数据库文件不存在'
      });
    }

    // 创建临时导出文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFileName = `mms_backup_${timestamp}.sql`;
    const exportDir = path.join(__dirname, '../../../data/exports');
    
    // 确保导出目录存在
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportPath = path.join(exportDir, exportFileName);

    // 使用程序化方式导出数据库（不依赖sqlite3命令行工具）
    // 读取所有表并生成SQL
    let sqlDump = '-- SQLite Database Dump\n';
    sqlDump += `-- Generated at: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${dbPath}\n\n`;
    sqlDump += 'BEGIN TRANSACTION;\n\n';

    // 使用Promise方式处理异步导出，确保顺序执行
    (async () => {
      try {
        // 获取所有表
        const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");

        if (tables.length === 0) {
          sqlDump += '-- No tables found\n';
          sqlDump += '\nCOMMIT;\n';
          fs.writeFileSync(exportPath, sqlDump, 'utf8');
          
          // 记录操作日志
          const operationLogModel = require('../../models/operationLogModel');
          await operationLogModel.create({
            user_id: req.user.id,
            module: 'admin_data_management',
            action: 'export',
            resource_type: 'database',
            description: '导出数据库备份',
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req)
          }).catch(err => {
            console.error('记录操作日志失败:', err);
          });

          return res.json({
            success: true,
            message: '数据库导出成功',
            data: {
              filename: exportFileName,
              downloadUrl: `/api/admin/database/download/${exportFileName}`
            }
          });
        }

        // 顺序处理每个表（确保SQL语句按顺序生成）
        for (const table of tables) {
          const tableName = table.name;

          // 验证表名（防止SQL注入）
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error('无效的表名');
          }

          // 获取表结构
          const columns = await dbAll(`PRAGMA table_info(${tableName})`);

          // 生成CREATE TABLE语句
          const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
          const columnDefs = columns.map(col => {
            let def = `  ${col.name} ${col.type}`;
            if (col.notnull) def += ' NOT NULL';
            if (col.pk) def += ' PRIMARY KEY';
            if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
            return def;
          }).join(',\n');
          sqlDump += createTableSQL + columnDefs + '\n);\n\n';

          // 获取表数据
          const rows = await dbAll(`SELECT * FROM ${tableName}`);

          // 为每行数据生成INSERT语句
          rows.forEach(row => {
            const rowColumns = Object.keys(row);
            const values = rowColumns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            });
            sqlDump += `INSERT INTO ${tableName} (${rowColumns.join(', ')}) VALUES (${values.join(', ')});\n`;
          });
        }

        sqlDump += '\nCOMMIT;\n';

        // 写入文件
        fs.writeFileSync(exportPath, sqlDump, 'utf8');

        // 记录操作日志
        const operationLogModel = require('../../models/operationLogModel');
        await operationLogModel.create({
          user_id: req.user.id,
          module: 'admin_data_management',
          action: 'export',
          resource_type: 'database',
          description: '导出数据库备份',
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req)
        }).catch(err => {
          console.error('记录操作日志失败:', err);
        });

        res.json({
          success: true,
          message: '数据库导出成功',
          data: {
            filename: exportFileName,
            downloadUrl: `/api/admin/database/download/${exportFileName}`,
            size: fs.statSync(exportPath).size
          }
        });
      } catch (error) {
        next(error);
      }
    })();
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/database/download/:filename
 * 下载导出的SQL文件
 */
router.get('/download/:filename', (req, res, next) => {
  try {
    const { filename } = req.params;

    // 验证文件名（防止路径遍历攻击）
    if (!/^mms_backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sql$/.test(filename)) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
    }

    const exportDir = path.join(__dirname, '../../../data/exports');
    const filePath = path.join(exportDir, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 发送文件
    res.download(filePath, filename, (err) => {
      if (err) {
        if (!res.headersSent) {
          next(err);
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


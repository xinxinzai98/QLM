const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../../database/database');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logOperation } = require('./operationLogRoutes');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 配置文件上传
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `avatar_${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1 // 限制文件数量
  },
  fileFilter: (req, file, cb) => {
    // 严格验证文件类型（防止文件类型伪造）
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
    
    const extname = allowedExtensions.includes(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    // 同时验证扩展名和MIME类型
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅支持 JPEG、JPG、PNG、GIF、WEBP 格式'));
    }
  }
});

// 获取当前用户信息
router.get('/me', (req, res, next) => {
  try {
    db.get(
      'SELECT id, username, role, real_name, email, avatar, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }

        // 处理头像路径
        if (user.avatar) {
          user.avatar = `/uploads/avatars/${path.basename(user.avatar)}`;
        }

        res.json({
          success: true,
          data: user
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 更新个人信息
router.put('/me', (req, res, next) => {
  try {
    const { realName, email, password } = req.body;

    const updates = [];
    const params = [];

    if (realName !== undefined) {
      updates.push('real_name = ?');
      params.push(realName);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (password !== undefined && password !== '') {
      bcrypt.hash(password, 10).then((hashedPassword) => {
        updates.push('password = ?');
        params.push(hashedPassword);
        performUpdate();
      }).catch(next);
    } else {
      performUpdate();
    }

    function performUpdate() {
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.user.id);

      db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            return next(err);
          }

          // 记录操作日志
          logOperation(req, 'profile', 'update', 'user', req.user.id, '更新个人信息');

          res.json({
            success: true,
            message: '个人信息更新成功',
            data: {
              id: req.user.id
            }
          });
        }
      );
    }
  } catch (error) {
    next(error);
  }
});

// 上传头像
router.post('/avatar', upload.single('avatar'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    // 获取旧头像路径
    db.get('SELECT avatar FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        // 删除新上传的文件
        fs.unlinkSync(req.file.path);
        return next(err);
      }

      // 删除旧头像
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // 更新数据库
      db.run(
        `UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.file.filename, req.user.id],
        function(err) {
          if (err) {
            // 删除新上传的文件
            fs.unlinkSync(req.file.path);
            return next(err);
          }

          // 记录操作日志
          logOperation(req, 'profile', 'upload_avatar', 'user', req.user.id, '上传头像');

          res.json({
            success: true,
            message: '头像上传成功',
            data: {
              avatar: `/uploads/avatars/${req.file.filename}`
            }
          });
        }
      );
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// 删除头像
router.delete('/avatar', (req, res, next) => {
  try {
    db.get('SELECT avatar FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return next(err);
      }

      if (user.avatar) {
        const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }

      db.run(
        `UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.user.id],
        function(err) {
          if (err) {
            return next(err);
          }

          // 记录操作日志
          logOperation(req, 'profile', 'delete_avatar', 'user', req.user.id, '删除头像');

          res.json({
            success: true,
            message: '头像删除成功'
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


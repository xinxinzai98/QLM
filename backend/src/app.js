const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./api/routes/authRoutes');
const materialRoutes = require('./api/routes/materialRoutes');
const inventoryRoutes = require('./api/routes/inventoryRoutes');
const dashboardRoutes = require('./api/routes/dashboardRoutes');
const userRoutes = require('./api/routes/userRoutes');
const stocktakingRoutes = require('./api/routes/stocktakingRoutes');
const profileRoutes = require('./api/routes/profileRoutes');
const operationLogRoutes = require('./api/routes/operationLogRoutes');
const notificationRoutes = require('./api/routes/notificationRoutes');
const searchRoutes = require('./api/routes/searchRoutes');
const exportRoutes = require('./api/routes/exportRoutes');
const adminDataRoutes = require('./api/routes/adminDataRoutes');
const adminDataRoutes = require('./api/routes/adminDataRoutes');

const app = express();

// 信任代理（用于正确获取客户端IP地址）
// 在生产环境中，如果使用Nginx等反向代理，需要配置此项
app.set('trust proxy', true);

// 中间件配置
app.use(cors());

// 响应压缩（减少网络传输）
app.use(compression({
    level: 6, // 压缩级别 1-9，6是平衡点
    filter: (req, res) => {
        // 仅压缩JSON和文本响应
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// 请求限流（防止恶意请求和DDoS）
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100000, // 限制每个IP在15分钟内最多100000次请求 (极大放宽限制)
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true, // 返回RateLimit-* headers
    legacyHeaders: false, // 禁用X-RateLimit-* headers
});

// 对API路由应用限流（登录接口使用更宽松的限制）
app.use('/api/', limiter);

// 登录接口使用更宽松的限流（防止暴力破解）
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10000, // 15分钟内最多10000次登录尝试
    message: {
        success: false,
        message: '登录尝试次数过多，请15分钟后再试'
    },
    skipSuccessfulRequests: true, // 成功登录不计入限制
});

app.use('/api/auth/login', loginLimiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务（用于头像访问）
// Adjusted path to point to backend/uploads (sibling of src)
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 静态文件服务（用于数据库导出文件下载）
const exportsDir = path.join(__dirname, '../../data/exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}
app.use('/api/admin/database/download', express.static(exportsDir));

// 生产环境服务前端静态资源
if (process.env.NODE_ENV === 'production') {
    const publicDir = path.join(__dirname, '../public');
    if (fs.existsSync(publicDir)) {
        app.use(express.static(publicDir));

        // SPA 路由回退 handling
        app.get('*', (req, res, next) => {
            if (req.url.startsWith('/api/')) return next();
            res.sendFile(path.join(publicDir, 'index.html'));
        });
    }
}

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stocktaking', stocktakingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/operation-logs', operationLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin/database', adminDataRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MMS Backend is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // 记录详细错误到控制台（生产环境也应记录，但使用结构化日志）
    console.error('Error:', {
        message: err.message,
        stack: isDevelopment ? err.stack : undefined, // 生产环境不输出堆栈到控制台
        url: req.url,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
    });

    // 生产环境仅返回通用错误信息，避免泄露敏感信息
    const errorMessage = isDevelopment
        ? err.message || 'Internal server error'
        : '服务器内部错误，请稍后重试';

    // 不返回错误堆栈给客户端（即使是开发环境也应谨慎）
    res.status(err.status || 500).json({
        success: false,
        message: errorMessage,
        // 仅在开发环境且错误状态码为4xx时返回详细信息
        ...(isDevelopment && err.status && err.status < 500 && {
            details: err.message
        })
    });
});

module.exports = app;

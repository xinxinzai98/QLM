require('dotenv').config();
const { init } = require('./src/database/database');
const app = require('./src/app');

// 环境变量验证（启动时检查关键配置）
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  // 生产环境强制要求JWT_SECRET
  if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      errors.push(
        'FATAL: JWT_SECRET must be set in production environment. ' +
        'Please set a strong secret key (minimum 32 characters) in environment variables.'
      );
    } else if (jwtSecret.length < 32) {
      errors.push(
        'FATAL: JWT_SECRET must be at least 32 characters long. ' +
        `Current length: ${jwtSecret.length}. ` +
        'Please set a strong secret key (minimum 32 characters) in environment variables.'
      );
    }
  }

  if (errors.length > 0) {
    console.error('环境变量验证失败:');
    errors.forEach(error => console.error(`  ❌ ${error}`));
    if (isProduction) {
      console.error('\n应用启动失败，请修复环境变量配置后重试。');
      process.exit(1);
    } else {
      console.warn('\n⚠️  开发环境警告：生产环境部署前请修复这些问题。');
    }
  }
};

// 执行环境变量验证
validateEnvironment();

const PORT = process.env.PORT || 3000;

// 初始化数据库并启动服务器
init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`物料管理系统后端服务运行在 http://localhost:${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('启动失败:', error);
    process.exit(1);
  });


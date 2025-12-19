/**
 * 生成JWT密钥的工具脚本
 * 运行: node generate-jwt-secret.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 生成64字符的随机密钥（32字节的十六进制字符串）
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 读取现有的.env文件（.env应该在backend目录下，而不是scripts目录下）
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  // 如果.env不存在，创建基础模板
  envContent = `# 物料管理系统 - 环境变量配置
# JWT密钥（必须设置，至少32个字符，用于生产环境）
JWT_SECRET=

# JWT刷新令牌密钥（可选，默认使用JWT_SECRET + '_refresh'）
# JWT_REFRESH_SECRET=

# JWT Access Token过期时间（默认1小时）
# JWT_EXPIRES_IN=1h

# JWT Refresh Token过期时间（默认30天）
# JWT_REFRESH_EXPIRES_IN=30d

# 服务器端口（默认3000）
# PORT=3000

# 运行环境（development/production）
# NODE_ENV=development

# 数据库路径（默认 ./database/mms.db）
# DB_PATH=./database/mms.db
`;
}

// 生成新的密钥
const newSecret = generateSecret();

// 更新或添加JWT_SECRET
if (envContent.includes('JWT_SECRET=')) {
  // 替换现有的JWT_SECRET
  envContent = envContent.replace(
    /JWT_SECRET=.*/,
    `JWT_SECRET=${newSecret}`
  );
} else {
  // 添加JWT_SECRET到文件开头
  envContent = `JWT_SECRET=${newSecret}\n${envContent}`;
}

// 写入文件
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ JWT密钥已生成并保存到 .env 文件');
console.log(`📝 JWT_SECRET=${newSecret.substring(0, 20)}...`);
console.log('\n提示:');
console.log('- .env 文件已添加到 .gitignore，不会被提交到Git');
console.log('- 请妥善保管此密钥，不要泄露给他人');
console.log('- 生产环境请使用更强的密钥（至少64字符）');






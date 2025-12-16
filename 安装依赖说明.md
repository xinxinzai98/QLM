# 依赖安装说明

## 当前状态

检测到您的系统中**未安装Node.js**，需要先安装Node.js才能安装项目依赖。

## 安装步骤

### 第一步：安装Node.js

**方法1：手动下载安装（推荐）**
1. 访问 https://nodejs.org/
2. 下载 **LTS版本**（推荐v18或更高版本）
3. 运行安装程序，按默认选项安装
4. 安装完成后，**重启命令行窗口**（重要！）

**方法2：使用包管理器安装**

**Windows (使用Chocolatey):**
```powershell
choco install nodejs -y
```

**Windows (使用winget):**
```powershell
winget install OpenJS.NodeJS
```

**Mac (使用Homebrew):**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 第二步：验证安装

打开新的命令行窗口，运行：
```bash
node --version
npm --version
```

如果显示版本号，说明安装成功。

### 第三步：安装项目依赖

**方式1：使用依赖安装脚本（推荐）**
```bash
# Windows
install-dependencies.bat

# Mac/Linux
chmod +x install-dependencies.sh
./install-dependencies.sh
```

**方式2：使用一键启动脚本（会自动安装依赖）**
```bash
# Windows
start.bat

# Mac/Linux
./start.sh
```

**方式3：手动安装**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

## 常见问题

### 1. npm install 很慢或失败

**使用国内镜像（推荐）：**
```bash
npm config set registry https://registry.npmmirror.com
```

**或使用cnpm：**
```bash
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### 2. 依赖版本冲突

```bash
npm install --legacy-peer-deps
```

### 3. 权限问题（Mac/Linux）

```bash
sudo npm install
```

### 4. 清除缓存后重试

```bash
npm cache clean --force
npm install
```

## 需要安装的依赖清单

### 后端依赖
- express, sqlite3, jsonwebtoken, bcryptjs
- cors, dotenv, body-parser, multer
- compression, express-rate-limit, express-validator
- **xlsx** (新增，用于Excel导出)

### 前端依赖
- vue, vue-router, pinia, element-plus
- axios, echarts, @element-plus/icons-vue
- **vuedraggable** (新增，用于拖拽排序)

## 安装完成后

运行 `start.bat` (Windows) 或 `./start.sh` (Mac/Linux) 启动系统。

默认账户：`admin` / `admin123`






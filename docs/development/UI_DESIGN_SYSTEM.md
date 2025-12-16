# UI设计系统文档

## 一、设计理念

### 1.1 核心原则

**专业感：**
- 严谨的布局系统
- 清晰的信息层级
- 一致的设计语言

**商业感：**
- 现代、高效、可信赖的视觉呈现
- 优化的用户体验
- 流畅的交互反馈

**品牌感：**
- "青绿氢能"品牌色的系统化应用
- 融合绿色（环保）与蓝色（科技）的双色系设计
- 独特的视觉识别

### 1.2 设计方向

融合 Ant Design Pro 的严谨布局、Element Plus 的清晰组件、以及现代 SaaS 产品（如 Linear、Stripe Dashboard）的简洁高效感，形成独特的"青绿氢能"物料管理系统视觉语言。

---

## 二、色彩系统

### 2.1 品牌主色 - 青绿色系（QingGreen）

```css
--color-primary-50: #f0fdf4;   /* 最浅，用于背景 */
--color-primary-100: #dcfce7;
--color-primary-200: #bbf7d0;
--color-primary-300: #86efac;
--color-primary-400: #4ade80;   /* 浅色，用于hover状态 */
--color-primary-500: #22c55e;   /* 主色，用于主要按钮、链接 */
--color-primary-600: #16a34a;   /* 深色，用于active状态 */
--color-primary-700: #15803d;
--color-primary-800: #166534;
--color-primary-900: #14532d;   /* 最深，用于文字 */
```

**使用场景：**
- 主按钮背景
- 激活状态
- 链接颜色
- 品牌元素

### 2.2 品牌辅助色 - 青蓝色系（CyanBlue）

```css
--color-secondary-50: #ecfeff;
--color-secondary-100: #cffafe;
--color-secondary-200: #a5f3fc;
--color-secondary-300: #67e8f9;
--color-secondary-400: #22d3ee;   /* 辅助色，用于次要按钮 */
--color-secondary-500: #06b6d4;   /* 主辅助色 */
--color-secondary-600: #0891b2;
--color-secondary-700: #0e7490;
--color-secondary-800: #155e75;
--color-secondary-900: #164e63;
```

**使用场景：**
- 次要按钮
- 辅助元素
- 图表配色

### 2.3 品牌渐变

```css
--gradient-primary: linear-gradient(135deg, #22c55e 0%, #06b6d4 100%);
--gradient-primary-hover: linear-gradient(135deg, #16a34a 0%, #0891b2 100%);
--gradient-primary-light: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
```

**使用场景：**
- Logo背景
- 主按钮背景
- 激活菜单项背景
- 页面标题文字

### 2.4 中性色系统

```css
--color-neutral-50: #fafafa;    /* 背景色 */
--color-neutral-100: #f5f5f5;   /* 浅背景 */
--color-neutral-200: #e5e5e5;   /* 边框 */
--color-neutral-300: #d4d4d4;   /* 禁用状态 */
--color-neutral-400: #a3a3a3;   /* 占位文字 */
--color-neutral-500: #737373;   /* 次要文字 */
--color-neutral-600: #525252;   /* 正文文字 */
--color-neutral-700: #404040;   /* 标题文字 */
--color-neutral-800: #262626;   /* 强调文字 */
--color-neutral-900: #171717;   /* 最深文字 */
```

**使用场景：**
- 文本颜色
- 边框颜色
- 背景颜色
- 禁用状态

### 2.5 功能色

**成功（Success）：**
```css
--color-success-500: #22c55e;   /* 与品牌主色一致 */
--color-success-600: #16a34a;
```

**警告（Warning）：**
```css
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
```

**错误（Error）：**
```css
--color-error-500: #ef4444;
--color-error-600: #dc2626;
```

**信息（Info）：**
```css
--color-info-500: #3b82f6;
--color-info-600: #2563eb;
```

---

## 三、字体系统

### 3.1 字体族

```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                     'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 
                     'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
                    Consolas, 'Courier New', monospace;
```

### 3.2 字体大小

**标题字体：**
```css
--font-size-h1: 2.441rem;    /* 39px - 页面主标题 */
--font-size-h2: 1.953rem;    /* 31px - 区块标题 */
--font-size-h3: 1.563rem;    /* 25px - 卡片标题 */
--font-size-h4: 1.25rem;     /* 20px - 小节标题 */
--font-size-h5: 1rem;        /* 16px - 小标题 */
--font-size-h6: 0.8rem;      /* 12.8px - 极小标题 */
```

**正文字体：**
```css
--font-size-xl: 1.25rem;     /* 20px - 大号正文 */
--font-size-lg: 1.125rem;    /* 18px - 中号正文 */
--font-size-base: 1rem;      /* 16px - 基础正文（默认） */
--font-size-sm: 0.875rem;    /* 14px - 小号正文 */
--font-size-xs: 0.75rem;     /* 12px - 极小正文 */
```

### 3.3 字重

```css
--font-weight-light: 300;
--font-weight-normal: 400;    /* 正文 */
--font-weight-medium: 500;    /* 强调文字 */
--font-weight-semibold: 600;  /* 小标题 */
--font-weight-bold: 700;      /* 标题 */
```

### 3.4 行高

```css
--line-height-tight: 1.25;    /* 标题 */
--line-height-normal: 1.5;    /* 正文 */
--line-height-relaxed: 1.75;  /* 长文本 */
```

### 3.5 字体应用规范

| 元素 | 字体大小 | 字重 | 行高 | 颜色 |
|------|---------|------|------|------|
| 页面主标题 | `--font-size-h1` | `--font-weight-bold` | `--line-height-tight` | `--color-neutral-900` |
| 区块标题 | `--font-size-h2` | `--font-weight-bold` | `--line-height-tight` | `--color-neutral-800` |
| 卡片标题 | `--font-size-h3` | `--font-weight-semibold` | `--line-height-tight` | `--color-neutral-800` |
| 正文 | `--font-size-base` | `--font-weight-normal` | `--line-height-normal` | `--color-neutral-700` |
| 次要文字 | `--font-size-sm` | `--font-weight-normal` | `--line-height-normal` | `--color-neutral-600` |
| 占位文字 | `--font-size-sm` | `--font-weight-normal` | `--line-height-normal` | `--color-neutral-400` |

---

## 四、间距系统

### 4.1 间距变量（基于8px基准）

```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px - 最小间距 */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px - 基础间距 */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px - 常用间距 */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

### 4.2 间距应用规范

| 场景 | 间距值 | 说明 |
|------|--------|------|
| 组件内部元素间距 | `--spacing-2` ~ `--spacing-4` | 按钮内图标与文字、输入框内边距 |
| 组件之间间距 | `--spacing-4` ~ `--spacing-6` | 表单元素之间、按钮组之间 |
| 区块之间间距 | `--spacing-8` ~ `--spacing-12` | 卡片之间、表单区块之间 |
| 页面边距 | `--spacing-6` ~ `--spacing-8` | 页面内容与边缘的距离 |
| 大区块间距 | `--spacing-16` ~ `--spacing-24` | 主要内容区块之间 |

---

## 五、阴影系统

### 5.1 阴影变量

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### 5.2 品牌色阴影

```css
--shadow-brand: 0 4px 12px rgba(34, 197, 94, 0.15);
--shadow-brand-lg: 0 10px 25px rgba(34, 197, 94, 0.2);
```

### 5.3 阴影应用规范

| 阴影变量 | 使用场景 |
|---------|---------|
| `--shadow-xs` | 输入框、小卡片 |
| `--shadow-sm` | 按钮、标签 |
| `--shadow-base` | 普通卡片、下拉菜单 |
| `--shadow-md` | 弹窗、模态框 |
| `--shadow-lg` | 大型弹窗、侧边栏 |
| `--shadow-brand` | 品牌按钮、Logo |

---

## 六、圆角系统

### 6.1 圆角变量

```css
--radius-none: 0;
--radius-sm: 0.25rem;    /* 4px - 小元素 */
--radius-base: 0.5rem;   /* 8px - 基础圆角 */
--radius-md: 0.75rem;    /* 12px - 卡片 */
--radius-lg: 1rem;       /* 16px - 大卡片 */
--radius-xl: 1.5rem;    /* 24px - 特殊元素 */
--radius-full: 9999px;   /* 完全圆形 */
```

### 6.2 圆角应用规范

| 圆角变量 | 使用场景 |
|---------|---------|
| `--radius-sm` | 标签、小按钮 |
| `--radius-base` | 输入框、普通按钮 |
| `--radius-md` | 卡片、弹窗 |
| `--radius-lg` | 大卡片、特殊容器 |
| `--radius-full` | 头像、圆形按钮 |

---

## 七、过渡与动画

### 7.1 过渡时长

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--transition-slower: 500ms;
```

### 7.2 缓动函数

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 7.3 常用过渡

```css
--transition-base: all var(--transition-base) var(--ease-in-out);
--transition-color: color var(--transition-base) var(--ease-in-out),
                     background-color var(--transition-base) var(--ease-in-out),
                     border-color var(--transition-base) var(--ease-in-out);
--transition-transform: transform var(--transition-base) var(--ease-out);
--transition-shadow: box-shadow var(--transition-base) var(--ease-in-out);
```

### 7.4 动画应用规范

| 动画类型 | 时长 | 缓动函数 | 使用场景 |
|---------|------|---------|---------|
| 微交互 | 150ms - 300ms | ease-in-out | 按钮hover、输入框focus |
| 页面过渡 | 300ms - 500ms | ease-out | 页面切换、卡片进入 |
| 加载动画 | 1s - 2s | ease-in-out | 骨架屏、加载图标 |

---

## 八、组件使用规范

### 8.1 按钮

**主按钮：**
```vue
<el-button type="primary">主要操作</el-button>
```

**样式特点：**
- 品牌渐变背景
- 品牌色阴影
- Hover时阴影提升和轻微位移

**次要按钮：**
```vue
<el-button>次要操作</el-button>
```

**样式特点：**
- 白色背景+边框
- Hover时边框和文字变为品牌色

### 8.2 输入框

**基础输入框：**
```vue
<el-input v-model="value" placeholder="请输入" />
```

**样式特点：**
- 统一圆角
- Focus时底部线条动画
- Hover时阴影增强

### 8.3 卡片

**基础卡片：**
```vue
<el-card>
  <template #header>
    <div class="card-header">标题</div>
  </template>
  <div>内容</div>
</el-card>
```

**样式特点：**
- 渐变背景
- 多层次阴影
- Hover时阴影提升

### 8.4 表格

**基础表格：**
```vue
<el-table :data="tableData">
  <el-table-column prop="name" label="名称" />
</el-table>
```

**样式特点：**
- 表头浅色背景
- 斑马纹样式
- Hover时品牌色浅色背景
- 行进入动画

### 8.5 标签

**功能标签：**
```vue
<el-tag type="success">成功</el-tag>
<el-tag type="warning">警告</el-tag>
<el-tag type="danger">错误</el-tag>
<el-tag type="info">信息</el-tag>
```

**样式特点：**
- 浅色背景+深色边框
- 统一圆角
- 语义化颜色

---

## 九、布局规范

### 9.1 页面结构

**标准页面结构：**
```vue
<template>
  <div class="page-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">页面标题</h1>
          <p class="page-description">页面描述</p>
        </div>
        <div class="page-header-right">
          <!-- 主要操作按钮 -->
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <el-card>
      <!-- 内容 -->
    </el-card>
  </div>
</template>
```

### 9.2 响应式断点

```css
--breakpoint-xs: 0px;        /* 手机 */
--breakpoint-sm: 640px;     /* 大手机 */
--breakpoint-md: 768px;     /* 平板 */
--breakpoint-lg: 1024px;    /* 小桌面 */
--breakpoint-xl: 1280px;    /* 桌面 */
--breakpoint-2xl: 1536px;   /* 大桌面 */
```

### 9.3 内容区域最大宽度

```css
max-width: 1600px;
margin: 0 auto;
```

---

## 十、交互规范

### 10.1 微交互

**按钮点击：**
- 波纹扩散效果
- 轻微位移反馈

**输入框聚焦：**
- 底部线条动画
- 阴影增强

**表格行Hover：**
- 背景色变化
- 轻微缩放

### 10.2 加载状态

**骨架屏：**
- 使用自定义骨架屏组件
- 渐变移动动画

**加载遮罩：**
- 毛玻璃效果背景
- 脉冲动画

### 10.3 反馈机制

**成功反馈：**
- 绿色消息提示
- 显示关闭按钮
- 2秒自动关闭

**错误反馈：**
- 红色消息提示
- 显示详细错误信息
- 3秒自动关闭

**警告反馈：**
- 黄色消息提示
- 视觉脉冲提醒

---

## 十一、代码规范

### 11.1 设计令牌使用

**必须使用设计令牌：**
```css
/* ✅ 正确 */
color: var(--color-primary-500);
padding: var(--spacing-4);
border-radius: var(--radius-md);

/* ❌ 错误 */
color: #22c55e;
padding: 16px;
border-radius: 8px;
```

### 11.2 组件样式

**使用scoped样式：**
```vue
<style scoped>
.custom-class {
  /* 组件样式 */
}
</style>
```

**全局样式放在styles目录：**
- `tokens.css` - 设计令牌
- `components.css` - 组件样式
- `global.css` - 全局样式

### 11.3 动画实现

**使用CSS动画：**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.element {
  animation: fadeIn var(--transition-base) var(--ease-out);
}
```

**避免JavaScript动画：**
- 优先使用CSS动画
- 仅在必要时使用JavaScript动画

---

## 十二、维护与扩展

### 12.1 新增设计令牌

如需新增设计令牌，请在 `frontend/src/styles/tokens.css` 中添加，并更新本文档。

### 12.2 新增组件样式

如需新增组件样式，请在 `frontend/src/styles/components.css` 中添加，并更新本文档。

### 12.3 主题切换（未来扩展）

设计系统已支持主题切换扩展，可通过修改CSS变量实现深色模式等。

---

**文档版本：** 1.0  
**最后更新：** 2024年  
**维护者：** 设计团队


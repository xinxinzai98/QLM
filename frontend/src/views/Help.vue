<template>
  <div class="help">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">帮助中心</h1>
          <p class="page-description">系统使用指南和常见问题解答</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="6">
        <el-card shadow="hover" class="help-nav">
          <el-menu
            :default-active="activeSection"
            @select="handleMenuSelect"
            class="help-menu"
          >
            <el-menu-item index="quick-start">
              <el-icon><Lightning /></el-icon>
              <span>快速开始</span>
            </el-menu-item>
            <el-menu-item index="materials">
              <el-icon><Box /></el-icon>
              <span>物料管理</span>
            </el-menu-item>
            <el-menu-item index="inventory">
              <el-icon><Document /></el-icon>
              <span>出入库管理</span>
            </el-menu-item>
            <el-menu-item index="dashboard">
              <el-icon><DataBoard /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="faq">
              <el-icon><QuestionFilled /></el-icon>
              <span>常见问题</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="18">
        <el-card shadow="hover" class="help-content">
          <!-- 快速开始 -->
          <div v-if="activeSection === 'quick-start'" class="help-section">
            <h2>快速开始</h2>
            <h3>启动系统</h3>
            <p><strong>Windows用户：</strong>双击 <code>start.bat</code> 文件</p>
            <p><strong>Mac/Linux用户：</strong>在终端执行 <code>./start.sh</code></p>
            
            <h3>默认账户</h3>
            <ul>
              <li><strong>用户名：</strong>admin</li>
              <li><strong>密码：</strong>admin123</li>
              <li><strong>角色：</strong>系统管理员</li>
            </ul>

            <h3>角色说明</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统管理员">
                拥有所有功能权限，可以管理用户、物料、出入库单
              </el-descriptions-item>
              <el-descriptions-item label="库存管理员">
                可以管理物料和审批出入库单，不能管理用户
              </el-descriptions-item>
              <el-descriptions-item label="普通人员">
                可以创建出入库单和查看物料信息，不能管理物料和用户
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 物料管理 -->
          <div v-if="activeSection === 'materials'" class="help-section">
            <h2>物料管理</h2>
            <h3>创建物料</h3>
            <ol>
              <li>点击"物料管理"菜单</li>
              <li>点击"新增物料"按钮</li>
              <li>填写物料信息（编码、名称、类别、单位等）</li>
              <li>设置库存阈值（最低库存、最高库存）</li>
              <li>点击"确定"保存</li>
            </ol>

            <h3>搜索物料</h3>
            <p>在搜索框输入物料编码或名称，支持模糊搜索。</p>

            <h3>编辑物料</h3>
            <p>点击物料列表中的"编辑"按钮，修改物料信息后保存。</p>
          </div>

          <!-- 出入库管理 -->
          <div v-if="activeSection === 'inventory'" class="help-section">
            <h2>出入库管理</h2>
            <h3>创建出入库单</h3>
            <ol>
              <li>点击"出入库管理"菜单</li>
              <li>点击"创建出入库单"按钮</li>
              <li>选择出入库类型（入库/出库）</li>
              <li>选择物料</li>
              <li>输入数量和单价（可选）</li>
              <li>填写备注（可选）</li>
              <li>提交申请</li>
            </ol>

            <h3>审批流程</h3>
            <ol>
              <li>普通人员或库存管理员创建出入库单</li>
              <li>库存管理员或系统管理员审批</li>
              <li>审批通过后自动更新库存</li>
            </ol>

            <h3>查看历史</h3>
            <p>在出入库单列表中可以查看所有历史记录，支持按状态、类型筛选。</p>
          </div>

          <!-- 仪表盘 -->
          <div v-if="activeSection === 'dashboard'" class="help-section">
            <h2>仪表盘</h2>
            <h3>统计卡片</h3>
            <p>页面顶部显示四个关键统计指标：</p>
            <ul>
              <li><strong>物料总数：</strong>系统中所有物料的数量</li>
              <li><strong>待审批单：</strong>等待审批的出入库单数量</li>
              <li><strong>今日出入库：</strong>今天创建的出入库单数量</li>
              <li><strong>低库存物料：</strong>当前库存低于最低库存阈值的物料数量</li>
            </ul>

            <h3>图表展示</h3>
            <p>仪表盘包含以下图表：</p>
            <ul>
              <li><strong>物料分类统计：</strong>饼图显示化学物料和金属物料的数量分布</li>
              <li><strong>出入库趋势：</strong>折线图显示最近30天的出入库趋势</li>
            </ul>

            <h3>自定义布局</h3>
            <p>点击"自定义仪表盘布局"可以调整模块位置和显示/隐藏模块。</p>
          </div>

          <!-- 常见问题 -->
          <div v-if="activeSection === 'faq'" class="help-section">
            <h2>常见问题</h2>
            
            <el-collapse v-model="activeFaq">
              <el-collapse-item title="如何修改密码？" name="1">
                <p>目前需要通过系统管理员修改。建议联系管理员重置密码。</p>
              </el-collapse-item>

              <el-collapse-item title="如何设置低库存预警？" name="2">
                <p>在创建或编辑物料时，设置"最低库存"字段。当当前库存低于最低库存时，系统会在仪表盘中显示预警。</p>
              </el-collapse-item>

              <el-collapse-item title="如何查看库存历史？" name="3">
                <p>系统会自动记录每次库存变更。可以通过查看出入库单详情了解库存变动情况。</p>
              </el-collapse-item>

              <el-collapse-item title="系统支持哪些浏览器？" name="4">
                <p>推荐使用以下浏览器：</p>
                <ul>
                  <li>Chrome（推荐）</li>
                  <li>Firefox</li>
                  <li>Edge</li>
                  <li>Safari</li>
                </ul>
              </el-collapse-item>

              <el-collapse-item title="数据会丢失吗？" name="5">
                <p>系统使用SQLite数据库存储数据，数据文件位于 <code>backend/mms.db</code>。建议定期备份此文件。</p>
              </el-collapse-item>

              <el-collapse-item title="如何导出数据？" name="6">
                <p>数据导出功能正在开发中。如需导出数据，请联系系统管理员。</p>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Lightning, Box, Document, DataBoard, QuestionFilled } from '@element-plus/icons-vue';
import Breadcrumb from '@/components/Breadcrumb.vue';

const activeSection = ref('quick-start');
const activeFaq = ref([]);

const handleMenuSelect = (key) => {
  activeSection.value = key;
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<style scoped>
.help {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-6);
}

.page-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--spacing-2) 0;
}

.page-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: 0;
}

.help-nav {
  position: sticky;
  top: var(--spacing-6);
}

.help-menu {
  border-right: none;
}

.help-content {
  min-height: 600px;
}

.help-section {
  padding: var(--spacing-4);
}

.help-section h2 {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-800);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid var(--color-primary-500);
}

.help-section h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
  margin-top: var(--spacing-6);
  margin-bottom: var(--spacing-3);
}

.help-section p {
  color: var(--color-neutral-600);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-3);
}

.help-section ul,
.help-section ol {
  color: var(--color-neutral-600);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-4);
  padding-left: var(--spacing-6);
}

.help-section li {
  margin-bottom: var(--spacing-2);
}

.help-section code {
  background-color: var(--color-neutral-100);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-primary-600);
}
</style>


<template>
  <div class="dashboard-customizer">
    <el-button
      text
      size="small"
      @click="showCustomizer = true"
      title="自定义工作台"
      class="customizer-trigger"
    >
      <el-icon><Setting /></el-icon>
      <span>自定义</span>
    </el-button>

    <el-drawer
      v-model="showCustomizer"
      title="自定义工作台"
      :size="400"
      direction="rtl"
    >
      <div class="customizer-content">
        <el-divider content-position="left">模块显示设置</el-divider>
        
        <div class="module-list">
          <div
            v-for="module in modules"
            :key="module.id"
            class="module-item"
            :class="{ 'is-hidden': !module.visible }"
          >
            <div class="module-info">
              <el-icon><component :is="module.icon" /></el-icon>
              <span>{{ module.label }}</span>
            </div>
            <el-switch
              v-model="module.visible"
              @change="saveLayout"
            />
          </div>
        </div>

        <el-divider content-position="left">模块排序</el-divider>
        
        <div class="sortable-list">
          <draggable
            v-model="modules"
            item-key="id"
            @end="saveLayout"
            handle=".drag-handle"
          >
            <template #item="{ element }">
              <div class="sortable-item">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <el-icon><component :is="element.icon" /></el-icon>
                <span>{{ element.label }}</span>
              </div>
            </template>
          </draggable>
        </div>

        <el-divider content-position="left">重置设置</el-divider>
        
        <el-button
          type="danger"
          plain
          @click="resetLayout"
          style="width: 100%;"
        >
          恢复默认布局
        </el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Setting, Rank, Box, Clock, Document, Warning, PieChart, TrendCharts } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

const showCustomizer = ref(false);

// 模块配置
const modules = ref([
  { id: 'stats', label: '统计卡片', icon: Box, visible: true, order: 0 },
  { id: 'categoryChart', label: '物料分类统计', icon: PieChart, visible: true, order: 1 },
  { id: 'trendChart', label: '出入库趋势', icon: TrendCharts, visible: true, order: 2 },
  { id: 'lowStock', label: '低库存物料', icon: Warning, visible: true, order: 3 },
  { id: 'pending', label: '待审批单', icon: Clock, visible: true, order: 4 }
]);

// 加载布局配置
const loadLayout = () => {
  const saved = localStorage.getItem('dashboardLayout');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 合并保存的配置
      modules.value.forEach(module => {
        const savedModule = parsed.find(m => m.id === module.id);
        if (savedModule) {
          module.visible = savedModule.visible !== undefined ? savedModule.visible : module.visible;
          module.order = savedModule.order !== undefined ? savedModule.order : module.order;
        }
      });
      // 按order排序
      modules.value.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('加载布局配置失败:', error);
    }
  }
};

// 保存布局配置
const saveLayout = () => {
  const config = modules.value.map((module, index) => ({
    id: module.id,
    visible: module.visible,
    order: index
  }));
  localStorage.setItem('dashboardLayout', JSON.stringify(config));
  ElMessage.success('布局已保存');
  
  // 触发自定义事件，通知Dashboard组件更新
  window.dispatchEvent(new CustomEvent('dashboard-layout-changed', { detail: config }));
};

// 重置布局
const resetLayout = () => {
  modules.value = [
    { id: 'stats', label: '统计卡片', icon: Box, visible: true, order: 0 },
    { id: 'categoryChart', label: '物料分类统计', icon: PieChart, visible: true, order: 1 },
    { id: 'trendChart', label: '出入库趋势', icon: TrendCharts, visible: true, order: 2 },
    { id: 'lowStock', label: '低库存物料', icon: Warning, visible: true, order: 3 },
    { id: 'pending', label: '待审批单', icon: Clock, visible: true, order: 4 }
  ];
  localStorage.removeItem('dashboardLayout');
  ElMessage.success('已恢复默认布局');
  window.dispatchEvent(new CustomEvent('dashboard-layout-changed', { detail: null }));
};

// 获取模块配置（供外部使用）
const getModuleConfig = () => {
  return modules.value.map((module, index) => ({
    id: module.id,
    visible: module.visible,
    order: index
  }));
};

onMounted(() => {
  loadLayout();
});

// 暴露方法供外部使用
defineExpose({
  getModuleConfig
});
</script>

<style scoped>
.dashboard-customizer {
  display: inline-block;
}

.customizer-trigger {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
  color: var(--color-neutral-700);
}

.customizer-trigger:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary-600);
}

.customizer-content {
  padding: var(--spacing-4);
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.module-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-neutral-200);
  transition: var(--transition-base);
}

.module-item.is-hidden {
  opacity: 0.5;
}

.module-item:hover {
  background-color: var(--color-neutral-50);
  border-color: var(--color-primary-200);
}

.module-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-base);
  color: var(--color-neutral-800);
}

.sortable-list {
  margin-bottom: var(--spacing-6);
}

.sortable-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  margin-bottom: var(--spacing-2);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-neutral-200);
  background-color: var(--color-bg-card);
  cursor: move;
  transition: var(--transition-base);
}

.sortable-item:hover {
  background-color: var(--color-neutral-50);
  border-color: var(--color-primary-200);
  transform: translateX(-4px);
}

.drag-handle {
  color: var(--color-neutral-400);
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>






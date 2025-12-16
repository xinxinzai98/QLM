<template>
  <el-tour v-model="currentStep" :steps="steps" @finish="handleFinish" @close="handleClose">
    <template #default="{ current }">
      <div v-if="current === 0" class="guide-content">
        <h3>欢迎使用物料管理系统！</h3>
        <p>这是一个快速引导，帮助您快速了解系统功能。</p>
      </div>
      <div v-else-if="current === 1" class="guide-content">
        <h3>快捷操作</h3>
        <p>使用顶部快捷操作区可以快速创建物料或出入库单。</p>
      </div>
      <div v-else-if="current === 2" class="guide-content">
        <h3>全局搜索</h3>
        <p>按 <kbd>Ctrl+K</kbd> 或 <kbd>Cmd+K</kbd> 打开全局搜索，快速查找物料、用户和出入库单。</p>
      </div>
      <div v-else-if="current === 3" class="guide-content">
        <h3>消息中心</h3>
        <p>点击右上角铃铛图标查看系统通知和待办任务。</p>
      </div>
      <div v-else-if="current === 4" class="guide-content">
        <h3>个性化定制</h3>
        <p>在工作台页面可以自定义显示哪些模块，调整布局顺序。</p>
      </div>
    </template>
  </el-tour>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentStep = ref(0);

// 检查是否需要显示引导
const shouldShowGuide = () => {
  const hasSeenGuide = localStorage.getItem('hasSeenGuide');
  const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';
  return !hasSeenGuide && isFirstLogin;
};

// 引导步骤配置
const steps = ref([
  {
    target: '.page-title',
    title: '欢迎使用物料管理系统',
    description: '这是一个快速引导，帮助您快速了解系统功能。',
    placement: 'bottom'
  },
  {
    target: '.quick-actions',
    title: '快捷操作',
    description: '使用顶部快捷操作区可以快速创建物料或出入库单。',
    placement: 'bottom'
  },
  {
    target: '.header-right',
    title: '全局搜索',
    description: '按 Ctrl+K 或 Cmd+K 打开全局搜索，快速查找物料、用户和出入库单。',
    placement: 'bottom'
  },
  {
    target: '.notification-trigger',
    title: '消息中心',
    description: '点击右上角铃铛图标查看系统通知和待办任务。',
    placement: 'bottom'
  },
  {
    target: '.dashboard-header',
    title: '个性化定制',
    description: '在工作台页面可以自定义显示哪些模块，调整布局顺序。',
    placement: 'bottom'
  }
]);

// 完成引导
const handleFinish = () => {
  localStorage.setItem('hasSeenGuide', 'true');
  localStorage.removeItem('isFirstLogin');
};

// 关闭引导
const handleClose = () => {
  localStorage.setItem('hasSeenGuide', 'true');
  localStorage.removeItem('isFirstLogin');
};

// 开始引导
const start = () => {
  if (shouldShowGuide()) {
    currentStep.value = 0;
  }
};

// 重置引导（用于测试）
const reset = () => {
  localStorage.removeItem('hasSeenGuide');
  localStorage.setItem('isFirstLogin', 'true');
  start();
};

onMounted(() => {
  // 延迟启动，确保DOM已渲染
  setTimeout(() => {
    start();
  }, 1000);
});

// 暴露方法
defineExpose({
  start,
  reset
});
</script>

<style scoped>
.guide-content {
  padding: var(--spacing-2);
}

.guide-content h3 {
  margin: 0 0 var(--spacing-2);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
}

.guide-content p {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-neutral-600);
  line-height: var(--line-height-relaxed);
}

kbd {
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-family: monospace;
  color: var(--color-neutral-700);
}
</style>






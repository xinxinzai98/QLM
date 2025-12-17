<template>
  <el-tour 
    v-model="isVisible"
    v-model:current="currentStep"
    @finish="handleFinish" 
    @close="handleClose"
  >
    <el-tour-step 
      :target="steps[0]?.target" 
      :placement="steps[0]?.placement"
      :title="steps[0]?.title"
    >
      <div class="guide-content">
        <p>这是一个快速引导，帮助您快速了解系统功能。</p>
      </div>
    </el-tour-step>

    <el-tour-step 
      :target="steps[1]?.target" 
      :placement="steps[1]?.placement"
      :title="steps[1]?.title"
    >
      <div class="guide-content">
        <p>使用顶部快捷操作区可以快速创建物料或出入库单。</p>
      </div>
    </el-tour-step>

    <el-tour-step 
      :target="steps[2]?.target" 
      :placement="steps[2]?.placement"
      :title="steps[2]?.title"
    >
      <div class="guide-content">
        <p>按 <kbd>Ctrl+K</kbd> 或 <kbd>Cmd+K</kbd> 打开全局搜索，快速查找物料、用户和出入库单。</p>
      </div>
    </el-tour-step>

    <el-tour-step 
      :target="steps[3]?.target" 
      :placement="steps[3]?.placement"
      :title="steps[3]?.title"
    >
      <div class="guide-content">
        <p>点击右上角铃铛图标查看系统通知和待办任务。</p>
      </div>
    </el-tour-step>

    <el-tour-step 
      :target="steps[4]?.target" 
      :placement="steps[4]?.placement"
      :title="steps[4]?.title"
    >
      <div class="guide-content">
        <p>在工作台页面可以自定义显示哪些模块，调整布局顺序。</p>
      </div>
    </el-tour-step>
  </el-tour>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentStep = ref(0);
const isVisible = ref(false);

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
    placement: 'bottom'
  },
  {
    target: '.quick-actions',
    title: '快捷操作',
    placement: 'bottom'
  },
  {
    target: '.header-right',
    title: '全局搜索',
    placement: 'bottom'
  },
  {
    target: '.notification-trigger',
    title: '消息中心',
    placement: 'bottom'
  },
  {
    target: '.dashboard-header',
    title: '个性化定制',
    placement: 'bottom'
  }
]);

// 完成引导
const handleFinish = () => {
  localStorage.setItem('hasSeenGuide', 'true');
  localStorage.removeItem('isFirstLogin');
  isVisible.value = false;
};

// 关闭引导
const handleClose = () => {
  localStorage.setItem('hasSeenGuide', 'true');
  localStorage.removeItem('isFirstLogin');
  isVisible.value = false;
};

// 开始引导
const start = () => {
  if (shouldShowGuide()) {
    currentStep.value = 0;
    isVisible.value = true;
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

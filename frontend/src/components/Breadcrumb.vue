<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <el-breadcrumb-item
      v-for="(item, index) in breadcrumbList"
      :key="index"
      :to="item.path"
    >
      <el-icon v-if="item.icon" style="margin-right: 4px;">
        <component :is="item.icon" />
      </el-icon>
      {{ item.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  DataBoard,
  Box,
  Document,
  User,
  DocumentChecked,
  Setting,
  QuestionFilled,
  List,
  House
} from '@element-plus/icons-vue';

const route = useRoute();

// 路由图标映射（基于路由名称）
const iconMap = {
  'Dashboard': DataBoard,
  'Materials': Box,
  'Inventory': Document,
  'Users': User,
  'Stocktaking': DocumentChecked,
  'Profile': User,
  'Settings': Setting,
  'Help': QuestionFilled,
  'OperationLogs': List
};

const breadcrumbList = computed(() => {
  const list = [
    { path: '/', title: '首页', icon: House }
  ];

  /* 
   遍历路由匹配记录 (matched)
   这能确保涵盖从父路由到当前子路由的完整路径
   并且使用路由定义中的 meta.title，避免硬编码
  */
  route.matched.forEach((match) => {
    // 跳过根路由（因为我们已经手动添加了“首页”）
    if (match.path === '/') return;

    // 只有定义了 meta.title 的路由才显示在面包屑中
    if (match.meta && match.meta.title) {
      // 避免重复添加（以防万一）
      if (list.length > 0 && list[list.length - 1].path === match.path) {
        return;
      }

      list.push({
        path: match.path,
        title: match.meta.title,
        icon: iconMap[match.name] || null
      });
    }
  });

  return list;
});
</script>

<style scoped>
.breadcrumb {
  margin-bottom: var(--spacing-4);
}

.breadcrumb :deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  display: flex;
  align-items: center;
  color: var(--color-neutral-600);
  font-size: var(--font-size-sm);
}

.breadcrumb :deep(.el-breadcrumb__inner.is-link) {
  color: var(--color-primary-600);
  transition: var(--transition-base);
}

.breadcrumb :deep(.el-breadcrumb__inner.is-link:hover) {
  color: var(--color-primary-500);
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--color-neutral-800);
  font-weight: var(--font-weight-medium);
}
</style>






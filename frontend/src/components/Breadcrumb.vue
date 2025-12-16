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
  List
} from '@element-plus/icons-vue';

const route = useRoute();

// 路由标题映射
const routeTitleMap = {
  '/dashboard': { title: '仪表盘', icon: DataBoard },
  '/materials': { title: '物料管理', icon: Box },
  '/inventory': { title: '出入库管理', icon: Document },
  '/users': { title: '用户管理', icon: User },
  '/stocktaking': { title: '物料盘点', icon: DocumentChecked },
  '/profile': { title: '个人中心', icon: User },
  '/settings': { title: '系统设置', icon: Setting },
  '/help': { title: '帮助中心', icon: QuestionFilled },
  '/operation-logs': { title: '操作日志', icon: List }
};

const breadcrumbList = computed(() => {
  const list = [
    { path: '/', title: '首页', icon: null }
  ];

  // 根据当前路由生成面包屑
  const path = route.path;
  const matched = route.matched;

  matched.forEach((match, index) => {
    if (match.path !== '/' && match.path !== path) {
      const routeInfo = routeTitleMap[match.path];
      if (routeInfo) {
        list.push({
          path: match.path,
          title: routeInfo.title,
          icon: routeInfo.icon
        });
      }
    }
  });

  // 添加当前页面
  const currentRouteInfo = routeTitleMap[path];
  if (currentRouteInfo && list[list.length - 1]?.path !== path) {
    list.push({
      path: path,
      title: currentRouteInfo.title,
      icon: currentRouteInfo.icon
    });
  }

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






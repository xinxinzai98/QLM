<template>
  <el-dialog
    v-model="visible"
    title="全局搜索"
    :width="600"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="global-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索物料、用户、出入库单..."
        size="large"
        @input="handleSearch"
        @keyup.enter="handleEnter"
        clearable
        ref="inputRef"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #suffix>
          <span class="search-hint">Ctrl+K</span>
        </template>
      </el-input>

      <div class="search-tabs" v-if="searchQuery">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="物料" name="materials" />
          <el-tab-pane label="用户" name="users" />
          <el-tab-pane label="出入库单" name="transactions" />
        </el-tabs>
      </div>

      <div class="search-results" v-loading="loading">
        <div v-if="!searchQuery" class="empty-state">
          <el-icon :size="48" class="empty-icon"><Search /></el-icon>
          <p>输入关键词开始搜索</p>
          <div class="search-shortcuts">
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>K</kbd>
              <span>打开搜索</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd>
              <span>关闭搜索</span>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="results.length === 0" class="empty-state">
          <el-icon :size="48" class="empty-icon"><DocumentDelete /></el-icon>
          <p>未找到相关结果</p>
        </div>

        <div v-else class="results-list">
          <div
            v-for="(item, index) in results"
            :key="`${item.type}-${item.id}`"
            class="result-item"
            :class="{ 'is-active': activeIndex === index }"
            @click="handleItemClick(item)"
            @mouseenter="activeIndex = index"
          >
            <div class="result-icon">
              <el-icon :size="20" :color="getTypeColor(item.type)">
                <component :is="getTypeIcon(item.type)" />
              </el-icon>
            </div>
            <div class="result-content">
              <div class="result-title" v-html="highlightText(item.title, searchQuery)"></div>
              <div class="result-meta">
                <el-tag :type="getTypeTag(item.type)" size="small">{{ getTypeLabel(item.type) }}</el-tag>
                <span class="result-desc" v-if="item.description" v-html="highlightText(item.description, searchQuery)"></span>
              </div>
            </div>
            <div class="result-action">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, DocumentDelete, ArrowRight, Box, User, Document } from '@element-plus/icons-vue';
import api from '@/utils/api';
import { handleApiError } from '@/utils/errorHandler';

const router = useRouter();
const visible = ref(false);
const searchQuery = ref('');
const activeTab = ref('all');
const loading = ref(false);
const results = ref([]);
const activeIndex = ref(-1);
const inputRef = ref(null);

// 转义正则表达式特殊字符
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 转义HTML特殊字符（XSS防护）
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// 高亮文本（安全版本，防止XSS）
const highlightText = (text, query) => {
  if (!text || !query) return escapeHtml(String(text));
  
  // 转义文本和查询字符串，防止XSS
  const escapedText = escapeHtml(String(text));
  const escapedQuery = escapeRegExp(escapeHtml(String(query)));
  
  // 创建高亮标记
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
};

// 获取类型图标
const getTypeIcon = (type) => {
  const iconMap = {
    material: Box,
    user: User,
    transaction: Document
  };
  return iconMap[type] || Document;
};

// 获取类型颜色（使用CSS变量）
const getTypeColor = (type) => {
  // 返回CSS变量名，由样式系统处理
  const colorMap = {
    material: 'var(--color-primary-500)',
    user: 'var(--color-info-500)',
    transaction: 'var(--color-warning-500)'
  };
  return colorMap[type] || 'var(--color-neutral-500)';
};

// 获取类型标签
const getTypeLabel = (type) => {
  const labelMap = {
    material: '物料',
    user: '用户',
    transaction: '出入库单'
  };
  return labelMap[type] || '未知';
};

// 获取类型Tag类型
const getTypeTag = (type) => {
  const tagMap = {
    material: 'success',
    user: 'primary',
    transaction: 'warning'
  };
  return tagMap[type] || '';
};

// 搜索
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    results.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = await api.get('/search', {
      params: {
        q: searchQuery.value,
        type: activeTab.value === 'all' ? undefined : activeTab.value
      }
    });

    if (response.data.success) {
      results.value = response.data.data || [];
      activeIndex.value = results.value.length > 0 ? 0 : -1;
    }
  } catch (error) {
    handleApiError(error, '搜索失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// Tab切换
const handleTabChange = () => {
  if (searchQuery.value) {
    handleSearch();
  }
};

// 回车键处理
const handleEnter = () => {
  if (results.value.length > 0 && activeIndex.value >= 0) {
    handleItemClick(results.value[activeIndex.value]);
  }
};

// 点击结果项
const handleItemClick = (item) => {
  let path = '';
  switch (item.type) {
    case 'material':
      path = `/materials?id=${item.id}`;
      break;
    case 'user':
      path = `/users?id=${item.id}`;
      break;
    case 'transaction':
      path = `/inventory?id=${item.id}`;
      break;
  }
  
  if (path) {
    router.push(path);
    visible.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  searchQuery.value = '';
  results.value = [];
  activeIndex.value = -1;
  activeTab.value = 'all';
};

// 打开搜索
const open = () => {
  visible.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 监听可见性变化
watch(visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// 暴露方法
defineExpose({
  open
});
</script>

<style scoped>
.global-search {
  padding: var(--spacing-4);
}

.search-hint {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-400);
  padding: 0 var(--spacing-2);
  background-color: var(--color-neutral-100);
  border-radius: var(--radius-sm);
}

.search-tabs {
  margin-top: var(--spacing-4);
}

.search-results {
  margin-top: var(--spacing-4);
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12) var(--spacing-4);
  text-align: center;
}

.empty-icon {
  color: var(--color-neutral-300);
}

.empty-state p {
  margin-top: var(--spacing-4);
  color: var(--color-neutral-600);
  font-size: var(--font-size-base);
}

.search-shortcuts {
  display: flex;
  gap: var(--spacing-4);
  margin-top: var(--spacing-6);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

kbd {
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-family: monospace;
}

.loading-state {
  padding: var(--spacing-4);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-neutral-200);
  cursor: pointer;
  transition: var(--transition-base);
}

.result-item:hover,
.result-item.is-active {
  background-color: var(--color-neutral-50);
  border-color: var(--color-primary-200);
  transform: translateX(4px);
}

.result-icon {
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
  margin-bottom: var(--spacing-1);
}

.result-title :deep(mark) {
  background-color: var(--color-warning-200);
  color: var(--color-warning-800);
  padding: 0 2px;
  border-radius: 2px;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
}

.result-desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-desc :deep(mark) {
  background-color: var(--color-warning-200);
  color: var(--color-warning-800);
  padding: 0 2px;
  border-radius: 2px;
}

.result-action {
  flex-shrink: 0;
  color: var(--color-neutral-400);
}
</style>



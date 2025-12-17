<template>
  <div class="operation-logs">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">操作日志</h1>
          <p class="page-description">查看系统操作记录，追踪用户行为</p>
        </div>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">日志列表</span>
        </div>
      </template>

      <div class="search-bar">
        <el-select
          v-model="searchForm.module"
          placeholder="选择模块"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="物料管理" value="materials" />
          <el-option label="出入库管理" value="inventory" />
          <el-option label="用户管理" value="users" />
          <el-option label="盘点管理" value="stocktaking" />
        </el-select>
        <el-select
          v-model="searchForm.action"
          placeholder="选择操作"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="创建" value="create" />
          <el-option label="更新" value="update" />
          <el-option label="删除" value="delete" />
          <el-option label="批准" value="approve" />
          <el-option label="拒绝" value="reject" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px; margin-right: 10px"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table
        :data="logList"
        v-loading="loading"
        style="width: 100%; margin-top: 20px"
      >
        <template #empty>
          <el-empty description="暂无操作日志" :image-size="100" />
        </template>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag size="small">
              {{
                row.module === 'materials'
                  ? '物料管理'
                  : row.module === 'inventory'
                  ? '出入库管理'
                  : row.module === 'users'
                  ? '用户管理'
                  : row.module === 'stocktaking'
                  ? '盘点管理'
                  : row.module
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.action === 'create'
                  ? 'success'
                  : row.action === 'update'
                  ? 'primary'
                  : row.action === 'delete'
                  ? 'danger'
                  : row.action === 'approve'
                  ? 'success'
                  : 'warning'
              "
              size="small"
            >
              {{
                row.action === 'create'
                  ? '创建'
                  : row.action === 'update'
                  ? '更新'
                  : row.action === 'delete'
                  ? '删除'
                  : row.action === 'approve'
                  ? '批准'
                  : row.action === 'reject'
                  ? '拒绝'
                  : row.action
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="resource_type" label="资源类型" width="100" />
        <el-table-column prop="resource_id" label="资源ID" width="100" />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import api from '@/utils/api';
import { Search } from '@element-plus/icons-vue';
import { handleApiError } from '@/utils/errorHandler';
import Breadcrumb from '@/components/Breadcrumb.vue';

const loading = ref(false);
const logList = ref([]);
const dateRange = ref([]);
const searchForm = reactive({
  module: '',
  action: '',
  userId: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    searchForm.startDate = newVal[0];
    searchForm.endDate = newVal[1];
  } else {
    searchForm.startDate = '';
    searchForm.endDate = '';
  }
});

// 获取操作日志列表
const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      module: searchForm.module,
      action: searchForm.action,
      userId: searchForm.userId,
      startDate: searchForm.startDate,
      endDate: searchForm.endDate
    };
    const response = await api.get('/operation-logs', { params });
    if (response.data.success) {
      logList.value = response.data.data.list;
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    handleApiError(error, '获取操作日志失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchLogs();
};

// 重置
const handleReset = () => {
  searchForm.module = '';
  searchForm.action = '';
  searchForm.userId = '';
  dateRange.value = [];
  searchForm.startDate = '';
  searchForm.endDate = '';
  handleSearch();
};

// 分页
const handlePageChange = () => {
  fetchLogs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = () => {
  pagination.page = 1;
  fetchLogs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.operation-logs {
  padding: 0;
  max-width: 1600px;
  margin: 0 auto;
}

/* 页面标题区域 */
.page-header {
  margin-bottom: var(--spacing-8);
  padding-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--color-neutral-200);
}

.page-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-6);
  flex-wrap: wrap;
}

.page-header-left {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-900);
  margin: 0 0 var(--spacing-2);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: var(--font-size-base);
  color: var(--color-neutral-600);
  margin: 0;
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.pagination {
  margin-top: var(--spacing-6);
  display: flex;
  justify-content: flex-end;
}
</style>


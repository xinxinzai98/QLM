<template>
  <div class="data-management">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">数据管理</h1>
          <p class="page-description">数据库备份与数据编辑管理</p>
        </div>
        <div class="page-header-right">
          <el-button type="success" @click="handleExport" :loading="exportLoading" size="large">
            <el-icon><Download /></el-icon>
            导出备份
          </el-button>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：数据库表列表 -->
      <el-col :span="isMobile ? 24 : 6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">数据库表</span>
              <el-button
                text
                type="primary"
                size="small"
                @click="fetchTables"
                :loading="tablesLoading"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-scrollbar height="calc(100vh - 300px)">
            <el-tree
              :data="tableTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="name"
              highlight-current
              @node-click="handleTableClick"
              v-loading="tablesLoading"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <el-icon v-if="data.isBusinessTable" style="color: #409EFF; margin-right: 5px;">
                    <Document />
                  </el-icon>
                  <el-icon v-else style="color: #909399; margin-right: 5px;">
                    <Files />
                  </el-icon>
                  <span>{{ node.label }}</span>
                </span>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 右侧：数据表格 -->
      <el-col :span="isMobile ? 24 : 18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ currentTableName || '请选择数据表' }}</span>
              <div v-if="currentTableName">
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="fetchTableData"
                  :loading="tableDataLoading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="!currentTableName" class="empty-state">
            <el-empty description="请从左侧选择数据表" :image-size="100" />
          </div>

          <div v-else>
            <!-- 分页信息 -->
            <div class="pagination-info" v-if="tableData.pagination">
              共 {{ tableData.pagination.total }} 条记录，
              第 {{ tableData.pagination.page }} / {{ tableData.pagination.totalPages }} 页
            </div>

            <!-- 数据表格 -->
            <el-table
              :data="tableData.rows"
              v-loading="tableDataLoading"
              style="width: 100%; margin-top: 20px"
              border
              stripe
              max-height="calc(100vh - 400px)"
            >
              <template #empty>
                <el-empty description="暂无数据" :image-size="100" />
              </template>

              <!-- 动态生成列 -->
              <el-table-column
                v-for="column in tableData.columns"
                :key="column.name"
                :prop="column.name"
                :label="column.name"
                :width="getColumnWidth(column.type)"
                min-width="120"
              >
                <template #default="{ row, $index }">
                  <!-- 可编辑单元格 -->
                  <el-input
                    v-if="!column.pk && isEditable(column.type)"
                    v-model="row[column.name]"
                    :type="getInputType(column.type)"
                    size="small"
                    @blur="handleCellEdit(row, column.name)"
                    @keyup.enter="handleCellEdit(row, column.name)"
                  />
                  <span v-else>{{ formatCellValue(row[column.name], column.type) }}</span>
                </template>
              </el-table-column>

              <!-- 操作列 -->
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="handleDeleteRow(row)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination" v-if="tableData.pagination">
              <el-pagination
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.pageSize"
                :total="tableData.pagination.total"
                :page-sizes="[20, 50, 100, 200]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除这条记录吗？此操作不可恢复。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Refresh, Document, Files, Delete } from '@element-plus/icons-vue';
import api from '@/utils/api';
import Breadcrumb from '@/components/Breadcrumb.vue';

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

// 表列表
const tablesLoading = ref(false);
const tableTree = ref([]);

// 当前选中的表
const currentTableName = ref('');
const tableDataLoading = ref(false);
const tableData = ref({
  columns: [],
  rows: [],
  pagination: null
});

// 分页
const pagination = ref({
  page: 1,
  pageSize: 50
});

// 导出
const exportLoading = ref(false);

// 删除
const deleteDialogVisible = ref(false);
const deleteLoading = ref(false);
const rowToDelete = ref(null);

// 获取表列表
const fetchTables = async () => {
  tablesLoading.value = true;
  try {
    const response = await api.get('/admin/database/tables');
    if (response.data.success) {
      const tables = response.data.data;
      // 构建树形结构（业务表和其他表）
      const businessTables = tables.filter(t => t.isBusinessTable);
      const otherTables = tables.filter(t => !t.isBusinessTable);
      
      tableTree.value = [
        {
          name: '业务表',
          children: businessTables,
          isBusinessTable: false
        },
        {
          name: '其他表',
          children: otherTables,
          isBusinessTable: false
        }
      ];
    }
  } catch (error) {
    handleApiError(error, '获取表列表失败');
  } finally {
    tablesLoading.value = false;
  }
};

// 处理表点击
const handleTableClick = (data) => {
  if (data.children) {
    // 点击的是分类节点，不处理
    return;
  }
  currentTableName.value = data.name;
  pagination.value.page = 1;
  fetchTableData();
};

// 获取表数据
const fetchTableData = async () => {
  if (!currentTableName.value) return;

  tableDataLoading.value = true;
  try {
    const response = await api.get(`/admin/database/table/${currentTableName.value}`, {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        orderBy: 'id',
        order: 'DESC'
      }
    });

    if (response.data.success) {
      tableData.value = response.data.data;
    }
  } catch (error) {
    handleApiError(error, '获取表数据失败');
  } finally {
    tableDataLoading.value = false;
  }
};

// 分页处理
const handlePageChange = () => {
  fetchTableData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = () => {
  pagination.value.page = 1;
  fetchTableData();
};

// 单元格编辑
const handleCellEdit = async (row, columnName) => {
  try {
    // 找到主键列
    const pkColumn = tableData.value.columns.find(col => col.pk);
    if (!pkColumn) {
      ElMessage.warning('无法找到主键，无法更新数据');
      return;
    }

    const pkValue = row[pkColumn.name];
    const updateData = { [columnName]: row[columnName] };

    const response = await api.put(
      `/admin/database/table/${currentTableName.value}/row/${pkValue}`,
      updateData
    );

    if (response.data.success) {
      ElMessage.success('更新成功');
    }
  } catch (error) {
    handleApiError(error, '更新数据失败');
    // 重新加载数据以恢复原值
    fetchTableData();
  }
};

// 删除行
const handleDeleteRow = (row) => {
  rowToDelete.value = row;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  if (!rowToDelete.value) return;

  deleteLoading.value = true;
  try {
    // 找到主键列
    const pkColumn = tableData.value.columns.find(col => col.pk);
    if (!pkColumn) {
      ElMessage.warning('无法找到主键，无法删除数据');
      return;
    }

    const pkValue = rowToDelete.value[pkColumn.name];
    const response = await api.delete(
      `/admin/database/table/${currentTableName.value}/row/${pkValue}`
    );

    if (response.data.success) {
      ElMessage.success('删除成功');
      deleteDialogVisible.value = false;
      rowToDelete.value = null;
      fetchTableData();
    }
  } catch (error) {
    handleApiError(error, '删除数据失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 导出备份
const handleExport = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要导出数据库备份吗？这将生成一个SQL文件供下载。',
      '确认导出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );

    exportLoading.value = true;
    const response = await api.post('/admin/database/export');

    if (response.data.success) {
      const { downloadUrl } = response.data.data;
      // 下载文件
      window.location.href = downloadUrl;
      ElMessage.success('数据库备份导出成功，正在下载...');
    }
  } catch (error) {
    if (error !== 'cancel') {
      handleApiError(error, '导出数据库备份失败');
    }
  } finally {
    exportLoading.value = false;
  }
};

// 工具函数
const getColumnWidth = (type) => {
  if (type.includes('TEXT') || type.includes('VARCHAR')) return 200;
  if (type.includes('INTEGER')) return 100;
  if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return 180;
  return 120;
};

const isEditable = (type) => {
  // 某些类型不可编辑
  if (type.includes('DATETIME') || type.includes('TIMESTAMP')) return false;
  return true;
};

const getInputType = (type) => {
  if (type.includes('INTEGER')) return 'number';
  if (type.includes('REAL') || type.includes('NUMERIC')) return 'number';
  return 'text';
};

const formatCellValue = (value, type) => {
  if (value === null || value === undefined) return '-';
  if (type.includes('DATETIME') || type.includes('TIMESTAMP')) {
    return new Date(value).toLocaleString('zh-CN');
  }
  return value;
};

// 错误处理
const handleApiError = (error, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage || '操作失败';
  ElMessage.error(message);
  console.error('API Error:', error);
};

// 初始化
onMounted(() => {
  fetchTables();
});
</script>

<style scoped lang="scss">
.data-management {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    .page-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .page-header-left {
        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .page-description {
          font-size: 14px;
          color: var(--el-text-color-regular);
          margin: 0;
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: 14px;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .pagination-info {
    padding: 10px 0;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .data-management {
    padding: 10px;

    .page-header {
      .page-header-content {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  }
}
</style>


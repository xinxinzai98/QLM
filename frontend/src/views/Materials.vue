<template>
  <div class="materials">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">物料管理</h1>
          <p class="page-description">管理所有物料信息，包括库存、分类和属性</p>
        </div>
        <div class="page-header-right">
          <el-button
            v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
            type="primary"
            @click="handleAdd"
            size="large"
          >
            <el-icon><Plus /></el-icon>
            新增物料
          </el-button>
        </div>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">物料列表</span>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索物料编码或名称（按Enter搜索）"
          style="width: 300px; margin-right: 10px"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
          @input="handleSearchInput"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.category"
          placeholder="选择类别"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="化学物料" value="chemical" />
          <el-option label="金属物料" value="metal" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 批量操作工具栏 -->
      <div class="batch-actions" v-if="selectedMaterials.length > 0">
        <div class="batch-info">
          <span>已选择 <strong>{{ selectedMaterials.length }}</strong> 项</span>
        </div>
        <div class="batch-buttons">
          <el-button
            v-if="userStore.isSystemAdmin"
            type="danger"
            @click="handleBatchDelete"
            :loading="batchLoading"
          >
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button
            type="primary"
            @click="handleBatchExport"
            :loading="batchLoading"
          >
            <el-icon><Download /></el-icon>
            批量导出
          </el-button>
          <el-button @click="clearSelection">
            取消选择
          </el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        :data="materialList"
        v-loading="loading"
        style="width: 100%; margin-top: var(--spacing-6)"
        class="materials-table"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <template #empty>
          <el-empty description="暂无物料数据" :image-size="100">
            <el-button
              v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
              type="primary"
              @click="handleAdd"
            >
              创建第一个物料
            </el-button>
          </el-empty>
        </template>
        <el-table-column
          type="selection"
          width="55"
          :selectable="(row) => userStore.isSystemAdmin || userStore.isInventoryManager"
        />
        <el-table-column prop="material_code" label="物料编码" width="150" />
        <el-table-column prop="material_name" label="物料名称" min-width="150" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag :type="row.category === 'chemical' ? 'success' : 'warning'">
              {{ row.category === 'chemical' ? '化学物料' : '金属物料' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_stock" label="当前库存" width="120">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.current_stock <= row.min_stock && row.min_stock > 0 }">
              {{ row.current_stock }}
            </span>
            <el-tooltip
              v-if="row.current_stock <= row.min_stock && row.min_stock > 0"
              content="库存低于最低库存阈值"
              placement="top"
            >
              <el-icon style="color: var(--color-error-500); margin-left: 5px;"><Warning /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最低库存" width="120" />
        <el-table-column prop="max_stock" label="最高库存" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="userStore.isSystemAdmin"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="dialogWidth"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        :label-width="formLabelWidth"
      >
        <el-form-item label="物料编码" prop="materialCode">
          <el-input 
            v-model="form.materialCode" 
            placeholder="请输入物料编码"
            :disabled="false"
          />
          <div v-if="isEdit" style="font-size: var(--font-size-xs); color: var(--color-neutral-500); margin-top: var(--spacing-1);">
            注意：修改编码将被记录到历史记录中
          </div>
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="form.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="form.category" placeholder="请选择类别" style="width: 100%">
            <el-option label="化学物料" value="chemical" />
            <el-option label="金属物料" value="metal" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位，如：kg、L、个" />
        </el-form-item>
        <el-form-item label="最低库存" prop="minStock">
          <el-input-number v-model="form.minStock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最高库存" prop="maxStock">
          <el-input-number v-model="form.maxStock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="物料详情"
      :width="dialogWidth"
    >
      <el-descriptions :column="descriptionColumns" border>
        <el-descriptions-item label="物料编码">{{ currentMaterial.material_code }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ currentMaterial.material_name }}</el-descriptions-item>
        <el-descriptions-item label="类别">
          <el-tag :type="currentMaterial.category === 'chemical' ? 'success' : 'warning'">
            {{ currentMaterial.category === 'chemical' ? '化学物料' : '金属物料' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentMaterial.unit }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ currentMaterial.current_stock }}</el-descriptions-item>
        <el-descriptions-item label="最低库存">{{ currentMaterial.min_stock }}</el-descriptions-item>
        <el-descriptions-item label="最高库存">{{ currentMaterial.max_stock }}</el-descriptions-item>
        <el-descriptions-item label="存放位置">{{ currentMaterial.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentMaterial.creator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ currentMaterial.description || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import api from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Delete, Download, Warning } from '@element-plus/icons-vue';
import { debounce } from '@/utils/debounce';
import { handleApiError, handleSuccess } from '@/utils/errorHandler';
import Breadcrumb from '@/components/Breadcrumb.vue';
import { useResponsive } from '@/composables/useResponsive';

const { dialogWidth, formLabelWidth, descriptionColumns, isMobile } = useResponsive();

const userStore = useUserStore();

const loading = ref(false);
const materialList = ref([]);
const searchForm = reactive({
  keyword: '',
  category: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const currentMaterial = ref({});
const selectedMaterials = ref([]);
const batchLoading = ref(false);
const tableRef = ref(null);

const dialogTitle = computed(() => isEdit.value ? '编辑物料' : '新增物料');

const form = reactive({
  materialCode: '',
  materialName: '',
  category: '',
  unit: '',
  minStock: 0,
  maxStock: 0,
  location: '',
  description: ''
});

const formRules = {
  materialCode: [
    { required: true, message: '请输入物料编码', trigger: 'blur' }
  ],
  materialName: [
    { required: true, message: '请输入物料名称', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择类别', trigger: 'change' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ]
};

// 获取物料列表
const fetchMaterials = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      category: searchForm.category
    };
    const response = await api.get('/materials', { params });
    if (response.data.success) {
      materialList.value = response.data.data.list;
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    handleApiError(error, '获取物料列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索（防抖处理）
const debouncedSearch = debounce(() => {
  pagination.page = 1;
  fetchMaterials();
}, 500);

const handleSearch = () => {
  debouncedSearch();
};

// 搜索输入处理（实时搜索，带防抖）
const handleSearchInput = () => {
  debouncedSearch();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.category = '';
  handleSearch();
};

// 分页
const handlePageChange = () => {
  fetchMaterials();
  // 滚动到表格顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = () => {
  pagination.page = 1;
  fetchMaterials();
  // 滚动到表格顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 新增
const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row) => {
  isEdit.value = true;
  currentMaterial.value = row;
  form.materialCode = row.material_code;
  form.materialName = row.material_name;
  form.category = row.category;
  form.unit = row.unit;
  form.minStock = row.min_stock;
  form.maxStock = row.max_stock;
  form.location = row.location || '';
  form.description = row.description || '';
  dialogVisible.value = true;
};

// 查看
const handleView = (row) => {
  currentMaterial.value = row;
  viewDialogVisible.value = true;
};

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该物料吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await api.delete(`/materials/${row.id}`);
      if (response.data.success) {
        handleSuccess('删除成功');
        fetchMaterials();
      }
    } catch (error) {
      handleApiError(error, '删除失败');
    }
  }).catch(() => {});
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (isEdit.value) {
          const response = await api.put(`/materials/${currentMaterial.value.id}`, form);
          if (response.data.success) {
            handleSuccess('更新成功');
            dialogVisible.value = false;
            fetchMaterials();
          }
        } else {
          const response = await api.post('/materials', form);
          if (response.data.success) {
            handleSuccess('创建成功');
            dialogVisible.value = false;
            fetchMaterials();
          }
        }
      } catch (error) {
        handleApiError(error, '提交失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 表格行类名（用于低库存高亮）
const getRowClassName = ({ row }) => {
  if (row.current_stock <= row.min_stock && row.min_stock > 0) {
    return 'warning-row';
  }
  return '';
};

// 批量选择处理
const handleSelectionChange = (selection) => {
  selectedMaterials.value = selection;
};

// 清除选择
const clearSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection();
  }
  selectedMaterials.value = [];
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请先选择要删除的物料');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedMaterials.value.length} 个物料吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    );

    batchLoading.value = true;
    const ids = selectedMaterials.value.map(item => item.id);
    
    // 逐个删除（因为后端可能没有批量删除接口）
    const deletePromises = ids.map(id => 
      api.delete(`/materials/${id}`).catch(err => {
        console.error(`删除物料 ${id} 失败:`, err);
        return { success: false, id };
      })
    );

    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r.data?.success !== false).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      handleSuccess(`成功删除 ${successCount} 个物料${failCount > 0 ? `，${failCount} 个失败` : ''}`);
      clearSelection();
      fetchMaterials();
    } else {
      handleApiError(new Error('批量删除失败'), '批量删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      handleApiError(error, '批量删除失败');
    }
  } finally {
    batchLoading.value = false;
  }
};

// 批量导出
const handleBatchExport = async () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请先选择要导出的物料');
    return;
  }

  try {
    batchLoading.value = true;
    const ids = selectedMaterials.value.map(item => item.id);
    
    // 调用导出API
    const response = await api.post('/export/materials', { ids }, {
      responseType: 'blob'
    });

    // 创建下载链接
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `物料导出_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    handleSuccess('导出成功');
  } catch (error) {
    handleApiError(error, '批量导出失败');
  } finally {
    batchLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.materialCode = '';
  form.materialName = '';
  form.category = '';
  form.unit = '';
  form.minStock = 0;
  form.maxStock = 0;
  form.location = '';
  form.description = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 关闭对话框
const handleDialogClose = () => {
  resetForm();
};

onMounted(() => {
  fetchMaterials();
});
</script>

<style scoped>
.materials {
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
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  margin-top: var(--spacing-4);
  background-color: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-base);
}

.batch-info {
  font-size: var(--font-size-base);
  color: var(--color-neutral-700);
}

.batch-info strong {
  color: var(--color-primary-600);
  font-weight: var(--font-weight-semibold);
}

.batch-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.pagination {
  margin-top: var(--spacing-6);
  display: flex;
  justify-content: flex-end;
}

.low-stock {
  color: var(--color-error-600);
  font-weight: var(--font-weight-semibold);
}

.warning-row {
  background-color: var(--color-error-50);
  transition: var(--transition-base);
}

.warning-row:hover {
  background-color: var(--color-error-100) !important;
}

/* 响应式优化 */
@media (max-width: 1024px) {
  .materials {
    padding: 0 var(--spacing-2);
  }

  .page-header {
    margin-bottom: var(--spacing-6);
    padding-bottom: var(--spacing-4);
  }

  .page-title {
    font-size: var(--font-size-h3);
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-wrap: wrap;
    gap: var(--spacing-3);
  }
  
  .search-bar .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .search-bar .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .page-header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-right {
    width: 100%;
  }

  .page-header-right .el-button {
    width: 100%;
  }

  /* 表格在移动端优化 */
  .materials-table {
    font-size: var(--font-size-sm);
  }

  .materials-table :deep(.el-table__header) {
    font-size: var(--font-size-xs);
  }
}
</style>


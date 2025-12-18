<template>
  <div class="inventory">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">出入库管理</h1>
          <p class="page-description">创建和管理物料出入库申请，跟踪审批流程</p>
        </div>
        <div class="page-header-right">
          <el-button
            v-if="userStore.isRegularUser || userStore.isInventoryManager || userStore.isSystemAdmin"
            type="primary"
            @click="handleAdd"
            size="large"
          >
            <el-icon><Plus /></el-icon>
            创建出入库单
          </el-button>
        </div>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">出入库单列表</span>
        </div>
      </template>

      <div class="search-bar">
        <el-select
          v-model="searchForm.status"
          placeholder="选择状态"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="待审批" value="pending" />
          <el-option label="已批准" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-select
          v-model="searchForm.transactionType"
          placeholder="选择类型"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="入库" value="in" />
          <el-option label="出库" value="out" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table
        :data="transactionList"
        v-loading="loading"
        style="width: 100%; margin-top: var(--spacing-6)"
      >
        <template #empty>
          <el-empty description="暂无出入库单数据" :image-size="100">
            <el-button
              v-if="userStore.isRegularUser || userStore.isInventoryManager || userStore.isSystemAdmin"
              type="primary"
              @click="handleAdd"
            >
              创建第一个出入库单
            </el-button>
          </el-empty>
        </template>
        <el-table-column prop="transaction_code" label="单号" width="180" />
        <el-table-column prop="material_name" label="物料名称" min-width="150" />
        <el-table-column prop="transaction_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.transaction_type === 'in' ? 'success' : 'warning'">
              {{ row.transaction_type === 'in' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column 
          v-if="!isMobile"
          prop="unit" 
          label="单位" 
          width="80" 
        />
        <el-table-column 
          v-if="!isMobile"
          prop="unit_price" 
          label="单价" 
          width="100"
        >
          <template #default="{ row }">
            {{ row.unit_price ? `¥${row.unit_price}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column 
          v-if="!isMobile"
          prop="total_amount" 
          label="总金额" 
          width="100"
        >
          <template #default="{ row }">
            {{ row.total_amount ? `¥${row.total_amount}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'approved'
                  ? 'success'
                  : row.status === 'rejected'
                  ? 'danger'
                  : row.status === 'cancelled'
                  ? 'info'
                  : 'warning'
              "
            >
              {{
                row.status === 'approved'
                  ? '已批准'
                  : row.status === 'rejected'
                  ? '已拒绝'
                  : row.status === 'cancelled'
                  ? '已取消'
                  : '待审批'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant_name" label="申请人" width="100" />
        <el-table-column prop="approver_name" label="审批人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
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
              v-if="
                (userStore.isInventoryManager || userStore.isSystemAdmin) &&
                row.status === 'pending'
              "
              link
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              审批
            </el-button>
            <el-button
              v-if="
                row.applicant_id === userStore.user?.id &&
                row.status === 'pending'
              "
              link
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消
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

    <!-- 创建出入库单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建出入库单"
      :width="dialogWidth"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        :label-width="formLabelWidth"
      >
        <el-form-item label="类型" prop="transactionType">
          <el-radio-group v-model="form.transactionType">
            <el-radio label="in">入库</el-radio>
            <el-radio label="out">出库</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="物料" prop="materialId">
          <el-select
            v-model="form.materialId"
            placeholder="请选择物料（可输入搜索）"
            filterable
            style="width: 100%"
            @change="handleMaterialChange"
          >
            <el-option
              v-for="material in materialOptions"
              :key="material.id"
              :value="material.id"
              :label="`${material.material_name} (${material.material_code})`"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600;">{{ material.material_name }}</div>
                  <div style="font-size: var(--font-size-xs); color: var(--color-neutral-500);">{{ material.material_code }}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 600; color: var(--color-primary-500);">库存: {{ material.current_stock }}{{ material.unit }}</div>
                  <el-tag
                    v-if="material.current_stock <= material.min_stock && material.min_stock > 0"
                    size="small"
                    type="danger"
                    style="margin-top: 2px;"
                  >
                    低库存
                  </el-tag>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="form.quantity"
            :min="0.01"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input-number
            v-model="form.unitPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="可选"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
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
      title="出入库单详情"
      :width="dialogWidth"
    >
      <el-descriptions :column="descriptionColumns" border>
        <el-descriptions-item label="单号">{{ currentTransaction.transaction_code }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentTransaction.transaction_type === 'in' ? 'success' : 'warning'">
            {{ currentTransaction.transaction_type === 'in' ? '入库' : '出库' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ currentTransaction.material_code }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ currentTransaction.material_name }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentTransaction.quantity }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentTransaction.unit }}</el-descriptions-item>
        <el-descriptions-item label="单价">
          {{ currentTransaction.unit_price ? `¥${currentTransaction.unit_price}` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="总金额">
          {{ currentTransaction.total_amount ? `¥${currentTransaction.total_amount}` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag
            :type="
              currentTransaction.status === 'approved'
                ? 'success'
                : currentTransaction.status === 'rejected'
                ? 'danger'
                : currentTransaction.status === 'cancelled'
                ? 'info'
                : 'warning'
            "
          >
            {{
              currentTransaction.status === 'approved'
                ? '已批准'
                : currentTransaction.status === 'rejected'
                ? '已拒绝'
                : currentTransaction.status === 'cancelled'
                ? '已取消'
                : '待审批'
            }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentTransaction.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ currentTransaction.approver_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentTransaction.created_at }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ currentTransaction.approved_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentTransaction.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="审批出入库单"
      :width="dialogWidth"
    >
      <el-form
        ref="approveFormRef"
        :model="approveForm"
        :label-width="formLabelWidth"
      >
        <el-form-item label="操作">
          <el-radio-group v-model="approveForm.action">
            <el-radio label="approve">批准</el-radio>
            <el-radio label="reject">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审批备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="approveLoading" @click="handleApproveSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import api from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { handleApiError, handleSuccess } from '@/utils/errorHandler';
import Breadcrumb from '@/components/Breadcrumb.vue';
import { useResponsive } from '@/composables/useResponsive';

const { dialogWidth, formLabelWidth, descriptionColumns, isMobile } = useResponsive();
const userStore = useUserStore();

const loading = ref(false);
const transactionList = ref([]);
const materialOptions = ref([]);
const searchForm = reactive({
  status: '',
  transactionType: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const approveDialogVisible = ref(false);
const submitLoading = ref(false);
const approveLoading = ref(false);
const formRef = ref(null);
const approveFormRef = ref(null);
const currentTransaction = ref({});
const currentApproveTransaction = ref(null);

const form = reactive({
  transactionType: 'in',
  materialId: '',
  quantity: 0,
  unitPrice: null,
  remark: ''
});

const approveForm = reactive({
  action: 'approve',
  remark: ''
});

const formRules = {
  transactionType: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  materialId: [
    { required: true, message: '请选择物料', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入数量', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '数量必须大于0', trigger: 'blur' }
  ]
};

// 获取出入库单列表
const fetchTransactions = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: searchForm.status,
      transactionType: searchForm.transactionType
    };
    const response = await api.get('/inventory', { params });
    if (response.data.success) {
      transactionList.value = response.data.data.list;
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    handleApiError(error, '获取出入库单列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取物料列表（用于下拉选择）
const fetchMaterials = async () => {
  try {
    const response = await api.get('/materials', { params: { page: 1, pageSize: 1000 } });
    if (response.data.success) {
      materialOptions.value = response.data.data.list;
    }
  } catch (error) {
    handleApiError(error, '获取物料列表失败', false); // 不显示错误提示，因为这是后台加载
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchTransactions();
};

// 重置
const handleReset = () => {
  searchForm.status = '';
  searchForm.transactionType = '';
  handleSearch();
};

// 分页
const handlePageChange = () => {
  fetchTransactions();
  // 滚动到表格顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = () => {
  pagination.page = 1;
  fetchTransactions();
  // 滚动到表格顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 新增
const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const selectedMaterial = computed(() => {
  if (!form.materialId) return null;
  return materialOptions.value.find(m => m.id === form.materialId);
});

// 物料选择变化
const handleMaterialChange = (materialId) => {
  const material = materialOptions.value.find(m => m.id === materialId);
  if (material && form.transactionType === 'out') {
    // 出库时，默认数量不能超过当前库存
    if (form.quantity > material.current_stock) {
      form.quantity = material.current_stock;
    }
  }
};

// 查看
const handleView = (row) => {
  currentTransaction.value = row;
  viewDialogVisible.value = true;
};

// 审批
const handleApprove = (row) => {
  currentApproveTransaction.value = row;
  approveForm.action = 'approve';
  approveForm.remark = '';
  approveDialogVisible.value = true;
};

// 取消
const handleCancel = (row) => {
  ElMessageBox.confirm('确定要取消该出入库单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await api.put(`/inventory/${row.id}/cancel`);
      if (response.data.success) {
        handleSuccess('取消成功');
        fetchTransactions();
      }
    } catch (error) {
      handleApiError(error, '取消失败');
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
        const response = await api.post('/inventory', form);
        if (response.data.success) {
          handleSuccess('创建成功，等待审批');
          dialogVisible.value = false;
          fetchTransactions();
        }
      } catch (error) {
        handleApiError(error, '提交失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 提交审批
const handleApproveSubmit = async () => {
  if (!approveFormRef.value) return;
  
  await approveFormRef.value.validate(async (valid) => {
    if (valid) {
      // 二次确认
      const actionText = approveForm.action === 'approve' ? '批准' : '拒绝';
      ElMessageBox.confirm(
        `确定要${actionText}该出入库单吗？`,
        '确认审批',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: approveForm.action === 'approve' ? 'success' : 'warning'
        }
      ).then(async () => {
        approveLoading.value = true;
        try {
          const response = await api.put(
            `/inventory/${currentApproveTransaction.value.id}/approve`,
            approveForm
          );
          if (response.data.success) {
            handleSuccess(`审批成功，已${actionText}`);
            approveDialogVisible.value = false;
            fetchTransactions();
          }
        } catch (error) {
          handleApiError(error, '审批失败');
        } finally {
          approveLoading.value = false;
        }
      }).catch(() => {});
    }
  });
};

// 重置表单
const resetForm = () => {
  form.transactionType = 'in';
  form.materialId = '';
  form.quantity = 0;
  form.unitPrice = null;
  form.remark = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 关闭对话框
const handleDialogClose = () => {
  resetForm();
};

onMounted(() => {
  fetchTransactions();
  fetchMaterials();
});
</script>

<style scoped>
.inventory {
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

.pagination {
  margin-top: var(--spacing-6);
  display: flex;
  justify-content: flex-end;
}

.stock-tip {
  margin-top: var(--spacing-1);
}

/* 响应式优化 */
@media (max-width: 1024px) {
  .inventory {
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
}
</style>


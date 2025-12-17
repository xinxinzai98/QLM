<template>
  <div class="stocktaking">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">物料盘点</h1>
          <p class="page-description">创建盘点任务，记录实际库存，生成盘点报告</p>
        </div>
        <div class="page-header-right">
          <el-button
            v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
            type="primary"
            @click="handleCreate"
            size="large"
          >
            <el-icon><Plus /></el-icon>
            创建盘点任务
          </el-button>
        </div>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">盘点任务列表</span>
        </div>
      </template>

      <div class="search-bar">
        <el-select
          v-model="searchForm.status"
          placeholder="选择状态"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="草稿" value="draft" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table
        :data="taskList"
        v-loading="loading"
        style="width: 100%; margin-top: 20px"
      >
        <template #empty>
          <el-empty description="暂无盘点任务" :image-size="100">
            <el-button
              v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
              type="primary"
              @click="handleCreate"
            >
              创建第一个盘点任务
            </el-button>
          </el-empty>
        </template>
        <el-table-column prop="task_code" label="任务编号" width="180" />
        <el-table-column prop="task_name" label="任务名称" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'completed'
                  ? 'success'
                  : row.status === 'cancelled'
                  ? 'info'
                  : row.status === 'in_progress'
                  ? 'warning'
                  : ''
              "
            >
              {{
                row.status === 'completed'
                  ? '已完成'
                  : row.status === 'cancelled'
                  ? '已取消'
                  : row.status === 'in_progress'
                  ? '进行中'
                  : '草稿'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.item_count > 0 ? Math.round((row.completed_count / row.item_count) * 100) : 0"
              :status="row.status === 'completed' ? 'success' : ''"
            />
          </template>
        </el-table-column>
        <el-table-column prop="item_count" label="物料数量" width="100" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
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
                (row.status === 'draft' || row.status === 'in_progress') &&
                (userStore.isSystemAdmin || userStore.isInventoryManager)
              "
              link
              type="success"
              size="small"
              @click="handleEdit(row)"
            >
              录入
            </el-button>
            <el-button
              v-if="
                row.status === 'in_progress' &&
                (userStore.isSystemAdmin || userStore.isInventoryManager)
              "
              link
              type="warning"
              size="small"
              @click="handleComplete(row)"
            >
              完成
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

    <!-- 创建盘点任务对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建盘点任务"
      width="700px"
      @close="handleCreateDialogClose"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="createForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="createForm.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="createForm.endDate"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="选择物料" prop="materialIds">
          <el-select
            v-model="createForm.materialIds"
            placeholder="请选择要盘点的物料（可多选）"
            multiple
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="material in materialOptions"
              :key="material.id"
              :label="`${material.material_code} - ${material.material_name}`"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看/录入对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="currentTask ? `盘点任务: ${currentTask.task_name}` : '盘点任务'"
      width="900px"
    >
      <div v-if="currentTask">
        <el-descriptions :column="3" border style="margin-bottom: 20px;">
          <el-descriptions-item label="任务编号">{{ currentTask.task_code }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentTask.task_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="
                currentTask.status === 'completed'
                  ? 'success'
                  : currentTask.status === 'cancelled'
                  ? 'info'
                  : currentTask.status === 'in_progress'
                  ? 'warning'
                  : ''
              "
            >
              {{
                currentTask.status === 'completed'
                  ? '已完成'
                  : currentTask.status === 'cancelled'
                  ? '已取消'
                  : currentTask.status === 'in_progress'
                  ? '进行中'
                  : '草稿'
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentTask.creator_name }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentTask.start_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ currentTask.end_date || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-table
          :data="currentTaskItems"
          style="width: 100%"
          v-loading="itemsLoading"
        >
          <el-table-column prop="material_code" label="物料编码" width="120" />
          <el-table-column prop="material_name" label="物料名称" min-width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="book_stock" label="账面库存" width="120" />
          <el-table-column prop="actual_stock" label="实际库存" width="150">
            <template #default="{ row }">
              <el-input-number
                v-if="currentTask.status !== 'completed' && currentTask.status !== 'cancelled'"
                v-model="row.actual_stock"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="handleItemChange(row)"
              />
              <span v-else>{{ row.actual_stock !== null ? row.actual_stock : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="difference" label="差异" width="120">
            <template #default="{ row }">
              <span
                :style="{
                  color: row.difference > 0 ? 'var(--color-success-500)' : row.difference < 0 ? 'var(--color-error-500)' : 'var(--color-neutral-500)',
                  fontWeight: row.difference !== 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)'
                }"
              >
                {{ row.difference > 0 ? '+' : '' }}{{ row.difference || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="difference_type" label="差异类型" width="100">
            <template #default="{ row }">
              <el-tag
                v-if="row.difference_type === 'surplus'"
                type="success"
                size="small"
              >
                盘盈
              </el-tag>
              <el-tag
                v-else-if="row.difference_type === 'shortage'"
                type="danger"
                size="small"
              >
                盘亏
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 盘点报告（如果已完成） -->
        <el-card v-if="currentTask.status === 'completed' && stocktakingReport" style="margin-top: 20px;">
          <template #header>
            <span>盘点报告</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总物料数">{{ stocktakingReport.totalItems }}</el-descriptions-item>
            <el-descriptions-item label="正常">{{ stocktakingReport.normalCount }}</el-descriptions-item>
            <el-descriptions-item label="盘盈数量">{{ stocktakingReport.surplusCount }}</el-descriptions-item>
            <el-descriptions-item label="盘盈总额">{{ stocktakingReport.totalSurplus }}</el-descriptions-item>
            <el-descriptions-item label="盘亏数量">{{ stocktakingReport.shortageCount }}</el-descriptions-item>
            <el-descriptions-item label="盘亏总额">{{ stocktakingReport.totalShortage }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-dialog>

    <!-- 完成盘点对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="完成盘点任务"
      width="500px"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        label-width="120px"
      >
        <el-form-item label="更新库存">
          <el-switch
            v-model="completeForm.updateStock"
            active-text="是"
            inactive-text="否"
          />
          <div style="font-size: var(--font-size-xs); color: var(--color-neutral-500); margin-top: var(--spacing-1);">
            选择"是"将根据实际库存更新物料库存
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="completeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入完成备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="completeLoading" @click="handleCompleteSubmit">
          确定完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import api from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import Breadcrumb from '@/components/Breadcrumb.vue';

const userStore = useUserStore();

const loading = ref(false);
const itemsLoading = ref(false);
const taskList = ref([]);
const materialOptions = ref([]);
const searchForm = reactive({
  status: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const completeDialogVisible = ref(false);
const createLoading = ref(false);
const completeLoading = ref(false);
const createFormRef = ref(null);
const completeFormRef = ref(null);
const currentTask = ref(null);
const currentTaskItems = ref([]);
const stocktakingReport = ref(null);

const createForm = reactive({
  taskName: '',
  startDate: '',
  endDate: '',
  materialIds: [],
  remark: ''
});

const completeForm = reactive({
  updateStock: true,
  remark: ''
});

const createFormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  materialIds: [
    { required: true, message: '请至少选择一个物料', trigger: 'change' },
    { type: 'array', min: 1, message: '请至少选择一个物料', trigger: 'change' }
  ]
};

// 获取盘点任务列表
const fetchTasks = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: searchForm.status
    };
    const response = await api.get('/stocktaking', { params });
    if (response.data.success) {
      taskList.value = response.data.data.list;
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    handleApiError(error, '获取盘点任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取物料列表
const fetchMaterials = async () => {
  try {
    const response = await api.get('/materials', { params: { page: 1, pageSize: 1000 } });
    if (response.data.success) {
      materialOptions.value = response.data.data.list;
    }
  } catch (error) {
    handleApiError(error, '获取物料列表失败', false); // 后台加载，不显示错误
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchTasks();
};

// 重置
const handleReset = () => {
  searchForm.status = '';
  handleSearch();
};

// 分页
const handlePageChange = () => {
  fetchTasks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = () => {
  pagination.page = 1;
  fetchTasks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 创建
const handleCreate = () => {
  resetCreateForm();
  createDialogVisible.value = true;
};

// 查看/编辑
const handleView = async (row) => {
  itemsLoading.value = true;
  try {
    const response = await api.get(`/stocktaking/${row.id}`);
    if (response.data.success) {
      currentTask.value = response.data.data;
      currentTaskItems.value = response.data.data.items || [];
      stocktakingReport.value = null;
      editDialogVisible.value = true;
    }
  } catch (error) {
    handleApiError(error, '获取盘点任务详情失败');
  } finally {
    itemsLoading.value = false;
  }
};

// 录入
const handleEdit = (row) => {
  handleView(row);
};

// 完成
const handleComplete = (row) => {
  currentTask.value = row;
  completeForm.updateStock = true;
  completeForm.remark = '';
  completeDialogVisible.value = true;
};

// 物料明细变更
const handleItemChange = async (row) => {
  if (row.actual_stock === null || row.actual_stock === undefined) {
    return;
  }

  try {
    const response = await api.put(
      `/stocktaking/${currentTask.value.id}/items/${row.id}`,
      {
        actualStock: row.actual_stock,
        remark: row.remark
      }
    );
    if (response.data.success) {
      // 更新本地数据
      row.difference = response.data.data.difference;
      row.difference_type = response.data.data.differenceType;
      ElMessage.success('录入成功');
    }
  } catch (error) {
    handleApiError(error, '录入失败');
    // 恢复原值
    row.actual_stock = row.book_stock;
  }
};

// 提交创建
const handleCreateSubmit = async () => {
  if (!createFormRef.value) return;
  
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      createLoading.value = true;
      try {
        const response = await api.post('/stocktaking', createForm);
        if (response.data.success) {
          handleSuccess('盘点任务创建成功');
          createDialogVisible.value = false;
          fetchTasks();
        }
      } catch (error) {
        handleApiError(error, '创建失败');
      } finally {
        createLoading.value = false;
      }
    }
  });
};

// 提交完成
const handleCompleteSubmit = async () => {
  if (!completeFormRef.value) return;
  
  ElMessageBox.confirm(
    completeForm.updateStock
      ? '确定要完成盘点并更新库存吗？'
      : '确定要完成盘点吗？（不更新库存）',
    '确认完成',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    completeLoading.value = true;
    try {
      const response = await api.put(
        `/stocktaking/${currentTask.value.id}/complete`,
        completeForm
      );
        if (response.data.success) {
          handleSuccess('盘点任务已完成');
          completeDialogVisible.value = false;
          editDialogVisible.value = false;
          // 如果生成了报告，显示报告
          if (response.data.data.report) {
            stocktakingReport.value = response.data.data.report;
            // 重新获取任务详情以显示报告
            await handleView({ id: currentTask.value.id });
          }
          fetchTasks();
        }
      } catch (error) {
        handleApiError(error, '完成失败');
      } finally {
      completeLoading.value = false;
    }
  }).catch(() => {});
};

// 重置创建表单
const resetCreateForm = () => {
  createForm.taskName = '';
  createForm.startDate = '';
  createForm.endDate = '';
  createForm.materialIds = [];
  createForm.remark = '';
  if (createFormRef.value) {
    createFormRef.value.resetFields();
  }
};

// 关闭创建对话框
const handleCreateDialogClose = () => {
  resetCreateForm();
};

onMounted(() => {
  fetchTasks();
  fetchMaterials();
});
</script>

<style scoped>
.stocktaking {
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
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>


<template>
  <div class="users">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">用户管理</h1>
          <p class="page-description">管理系统用户账号、角色和权限</p>
        </div>
        <div class="page-header-right">
          <el-button type="primary" @click="handleAdd" size="large">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">用户列表</span>
        </div>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名、姓名或邮箱（按Enter搜索）"
          style="width: 300px; margin-right: 10px"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.role"
          placeholder="选择角色"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="系统管理员" value="system_admin" />
          <el-option label="库存管理员" value="inventory_manager" />
          <el-option label="普通人员" value="regular_user" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table
        :data="userList"
        v-loading="loading"
        style="width: 100%; margin-top: 20px"
      >
        <template #empty>
          <el-empty description="暂无用户数据" :image-size="100">
            <el-button type="primary" @click="handleAdd">
              创建第一个用户
            </el-button>
          </el-empty>
        </template>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column 
          v-if="!isMobile"
          prop="email" 
          label="邮箱" 
          width="200" 
        />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag
              :type="
                row.role === 'system_admin'
                  ? 'danger'
                  : row.role === 'inventory_manager'
                  ? 'warning'
                  : 'success'
              "
            >
              {{
                row.role === 'system_admin'
                  ? '系统管理员'
                  : row.role === 'inventory_manager'
                  ? '库存管理员'
                  : '普通人员'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          v-if="!isMobile"
          prop="created_at" 
          label="创建时间" 
          width="180" 
        />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.id !== userStore.user?.id"
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
        <el-form-item label="用户名" prop="username" v-if="!isEdit">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="password" v-if="isEdit">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="留空则不修改密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="系统管理员" value="system_admin" />
            <el-option label="库存管理员" value="inventory_manager" />
            <el-option label="普通人员" value="regular_user" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import api from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { handleApiError, handleSuccess } from '@/utils/errorHandler';
import Breadcrumb from '@/components/Breadcrumb.vue';
import { useResponsive } from '@/composables/useResponsive';

const { dialogWidth, formLabelWidth, isMobile } = useResponsive();
const userStore = useUserStore();

const loading = ref(false);
const userList = ref([]);
const searchForm = reactive({
  keyword: '',
  role: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
const currentUser = ref({});

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户');

const form = reactive({
  username: '',
  password: '',
  role: '',
  realName: '',
  email: ''
});

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      role: searchForm.role
    };
    const response = await api.get('/users', { params });
    if (response.data.success) {
      userList.value = response.data.data.list;
      pagination.total = response.data.data.total;
    }
  } catch (error) {
    handleApiError(error, '获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchUsers();
};

// 重置
const handleReset = () => {
  searchForm.keyword = '';
  searchForm.role = '';
  handleSearch();
};

// 分页
const handlePageChange = () => {
  fetchUsers();
  // 滚动到表格顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSizeChange = () => {
  pagination.page = 1;
  fetchUsers();
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
  currentUser.value = row;
  form.username = row.username;
  form.password = '';
  form.role = row.role;
  form.realName = row.real_name || '';
  form.email = row.email || '';
  dialogVisible.value = true;
};

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await api.delete(`/users/${row.id}`);
      if (response.data.success) {
        handleSuccess('删除成功');
        fetchUsers();
      }
    } catch (error) {
      handleApiError(error, '删除失败');
    }
  }).catch(() => {});
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  // 编辑时，如果密码为空，则不需要验证密码规则
  const rules = isEdit.value && !form.password
    ? { ...formRules, password: [] }
    : formRules;
  
  formRef.value.clearValidate();
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const submitData = { ...form };
        if (isEdit.value && !submitData.password) {
          delete submitData.password;
        }
        
        if (isEdit.value) {
          const response = await api.put(`/users/${currentUser.value.id}`, submitData);
          if (response.data.success) {
            ElMessage.success('更新成功');
            dialogVisible.value = false;
            fetchUsers();
          }
        } else {
          const response = await api.post('/users', submitData);
          if (response.data.success) {
            handleSuccess('创建成功');
            dialogVisible.value = false;
            fetchUsers();
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

// 重置表单
const resetForm = () => {
  form.username = '';
  form.password = '';
  form.role = '';
  form.realName = '';
  form.email = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 关闭对话框
const handleDialogClose = () => {
  resetForm();
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.users {
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
  margin-bottom: var(--spacing-5);
}

.pagination {
  margin-top: var(--spacing-5);
  display: flex;
  justify-content: flex-end;
}
</style>


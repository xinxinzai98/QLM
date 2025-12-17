<template>
  <div class="profile">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">个人中心</h1>
          <p class="page-description">管理个人信息、头像和账户设置</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="8">
        <el-card>
          <template #header>
            <span>头像设置</span>
          </template>
          <div class="avatar-section">
            <el-upload
              class="avatar-uploader"
              :action="uploadAction"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :on-error="handleAvatarError"
              :before-upload="beforeAvatarUpload"
            >
              <el-avatar
                v-if="userInfo.avatar"
                :src="userInfo.avatar"
                :size="120"
                class="avatar"
              />
              <el-icon v-else class="avatar-uploader-icon" :size="120">
                <Plus />
              </el-icon>
            </el-upload>
            <div class="avatar-tips">
              <p>点击上传头像</p>
              <p style="font-size: var(--font-size-xs); color: var(--color-neutral-500);">支持 JPG、PNG、GIF 格式，大小不超过 2MB</p>
            </div>
            <el-button
              v-if="userInfo.avatar"
              type="danger"
              size="small"
              @click="handleDeleteAvatar"
              style="margin-top: 10px;"
            >
              删除头像
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="16">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="formRules"
            label-width="100px"
          >
            <el-form-item label="用户名">
              <el-input v-model="userInfo.username" disabled />
            </el-form-item>
            <el-form-item label="角色">
              <el-input
                :value="roleText"
                disabled
              />
            </el-form-item>
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="新密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="留空则不修改密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
                保存修改
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import api from '@/utils/api';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { handleApiError, handleSuccess } from '@/utils/errorHandler';
import Breadcrumb from '@/components/Breadcrumb.vue';

const userStore = useUserStore();

const formRef = ref(null);
const submitLoading = ref(false);
const userInfo = ref({});
const form = reactive({
  realName: '',
  email: '',
  password: ''
});

const formRules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const roleText = computed(() => {
  const roleMap = {
    system_admin: '系统管理员',
    inventory_manager: '库存管理员',
    regular_user: '普通人员'
  };
  return roleMap[userInfo.value.role] || '';
});

const uploadAction = computed(() => {
  return '/api/profile/avatar';
});

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${userStore.token}`
  };
});

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await api.get('/profile/me');
    if (response.data.success) {
      userInfo.value = response.data.data;
      form.realName = userInfo.value.real_name || '';
      form.email = userInfo.value.email || '';
      // 更新store中的用户信息
      if (userInfo.value.avatar) {
        userStore.user = { ...userStore.user, avatar: userInfo.value.avatar };
        localStorage.setItem('user', JSON.stringify(userStore.user));
      }
    }
  } catch (error) {
    handleApiError(error, '获取用户信息失败');
  }
};

// 上传成功
const handleAvatarSuccess = (response) => {
  if (response.success) {
    ElMessage.success('头像上传成功');
    const avatarPath = response.data.avatar.startsWith('http') 
      ? response.data.avatar 
      : `/api${response.data.avatar}`;
    userInfo.value.avatar = avatarPath;
    // 更新store
    userStore.user = { ...userStore.user, avatar: avatarPath };
    localStorage.setItem('user', JSON.stringify(userStore.user));
  } else {
    ElMessage.error(response.message || '头像上传失败');
  }
};

// 上传失败
const handleAvatarError = () => {
  ElMessage.error('头像上传失败，请重试');
};

// 上传前验证
const beforeAvatarUpload = (file) => {
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件（JPG、PNG、GIF、WEBP）');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }
  return true;
};

// 删除头像
const handleDeleteAvatar = () => {
  ElMessageBox.confirm('确定要删除头像吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await api.delete('/profile/avatar');
      if (response.data.success) {
        ElMessage.success('头像删除成功');
        userInfo.value.avatar = null;
        // 更新store
        userStore.user = { ...userStore.user, avatar: null };
        localStorage.setItem('user', JSON.stringify(userStore.user));
      }
    } catch (error) {
      handleApiError(error, '删除头像失败');
    }
  }).catch(() => {});
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  // 如果密码为空，则不需要验证密码规则
  const rules = !form.password
    ? { ...formRules, password: [] }
    : formRules;
  
  formRef.value.clearValidate();
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const submitData = { ...form };
        if (!submitData.password) {
          delete submitData.password;
        }
        
        const response = await api.put('/profile/me', submitData);
        if (response.data.success) {
          handleSuccess('个人信息更新成功');
          await fetchUserInfo();
        }
      } catch (error) {
        handleApiError(error, '更新失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 重置表单
const handleReset = () => {
  form.realName = userInfo.value.real_name || '';
  form.email = userInfo.value.email || '';
  form.password = '';
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.profile {
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

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-5);
}

.avatar-uploader {
  margin-bottom: var(--spacing-4);
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--color-neutral-300);
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--transition-base);
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--color-primary-500);
}

.avatar-uploader-icon {
  font-size: var(--font-size-2xl);
  color: var(--color-neutral-500);
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}

.avatar-tips {
  text-align: center;
  color: var(--color-neutral-600);
  font-size: var(--font-size-sm);
}
</style>


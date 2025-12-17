<template>
  <div class="settings">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">系统设置</h1>
          <p class="page-description">管理个人偏好和系统配置</p>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><User /></el-icon>
              <span>个人设置</span>
            </div>
          </template>

          <el-form :model="personalSettings" label-width="120px">
            <el-form-item label="每页显示数量">
              <el-select v-model="personalSettings.pageSize" style="width: 100%">
                <el-option label="10条" :value="10" />
                <el-option label="20条" :value="20" />
                <el-option label="50条" :value="50" />
                <el-option label="100条" :value="100" />
              </el-select>
            </el-form-item>

            <el-form-item label="默认排序">
              <el-select v-model="personalSettings.defaultSort" style="width: 100%">
                <el-option label="创建时间（最新）" value="created_at_desc" />
                <el-option label="创建时间（最早）" value="created_at_asc" />
                <el-option label="更新时间（最新）" value="updated_at_desc" />
                <el-option label="更新时间（最早）" value="updated_at_asc" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="savePersonalSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><Setting /></el-icon>
              <span>主题设置</span>
            </div>
          </template>

          <el-form label-width="120px">
            <el-form-item label="主题模式">
              <el-radio-group v-model="themeMode" @change="handleThemeChange">
                <el-radio label="light">浅色</el-radio>
                <el-radio label="dark">深色</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="主题色">
              <div class="theme-colors">
                <div
                  v-for="color in themeColors"
                  :key="color.name"
                  class="theme-color-item"
                  :class="{ active: currentThemeColor === color.name }"
                  @click="changeThemeColor(color.name)"
                >
                  <div class="color-preview" :style="{ background: color.gradient }"></div>
                  <span>{{ color.label }}</span>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </div>
          </template>

          <el-form :model="notificationSettings" label-width="120px">
            <el-form-item label="系统通知">
              <el-switch v-model="notificationSettings.system" />
            </el-form-item>

            <el-form-item label="待办提醒">
              <el-switch v-model="notificationSettings.todo" />
            </el-form-item>

            <el-form-item label="系统公告">
              <el-switch v-model="notificationSettings.announcement" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><DataBoard /></el-icon>
              <span>仪表盘设置</span>
            </div>
          </template>

          <el-button type="primary" @click="router.push('/dashboard?customize=true')">
            <el-icon><Setting /></el-icon>
            自定义仪表盘布局
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="hover" v-if="userStore.isSystemAdmin">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><Tools /></el-icon>
              <span>系统配置</span>
            </div>
          </template>

          <el-alert
            title="系统配置功能开发中"
            type="info"
            :closable="false"
            show-icon
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { User, Setting, Bell, DataBoard, Tools } from '@element-plus/icons-vue';
import Breadcrumb from '@/components/Breadcrumb.vue';

const router = useRouter();
const userStore = useUserStore();

const personalSettings = ref({
  pageSize: 20,
  defaultSort: 'created_at_desc'
});

const themeMode = ref('light');
const currentThemeColor = ref('qinggreen');

const themeColors = [
  { name: 'qinggreen', label: '青绿色', gradient: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)' },
  { name: 'blue', label: '蓝色', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  { name: 'purple', label: '紫色', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }
];

const notificationSettings = ref({
  system: true,
  todo: true,
  announcement: true
});

// 加载设置
const loadSettings = () => {
  const savedPersonal = localStorage.getItem('personalSettings');
  if (savedPersonal) {
    personalSettings.value = JSON.parse(savedPersonal);
  }

  const savedTheme = localStorage.getItem('themeMode');
  if (savedTheme) {
    themeMode.value = savedTheme;
  }

  const savedNotification = localStorage.getItem('notificationSettings');
  if (savedNotification) {
    notificationSettings.value = JSON.parse(savedNotification);
  }
};

// 保存个人设置
const savePersonalSettings = () => {
  localStorage.setItem('personalSettings', JSON.stringify(personalSettings.value));
  ElMessage.success('个人设置已保存');
};

// 保存通知设置
const saveNotificationSettings = () => {
  localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings.value));
  ElMessage.success('通知设置已保存');
};

// 切换主题
const handleThemeChange = (value) => {
  localStorage.setItem('themeMode', value);
  document.documentElement.setAttribute('data-theme', value);
  ElMessage.success('主题已切换');
};

// 切换主题色
const changeThemeColor = (color) => {
  currentThemeColor.value = color;
  localStorage.setItem('themeColor', color);
  ElMessage.success('主题色已切换');
};

onMounted(() => {
  loadSettings();
  const savedThemeColor = localStorage.getItem('themeColor');
  if (savedThemeColor) {
    currentThemeColor.value = savedThemeColor;
  }
});
</script>

<style scoped>
.settings {
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-6);
}

.page-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--spacing-2) 0;
}

.page-description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  margin: 0;
}

.card-header-with-icon {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
}

.theme-colors {
  display: flex;
  gap: var(--spacing-4);
  flex-wrap: wrap;
}

.theme-color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-base);
  border: 2px solid transparent;
  transition: var(--transition-base);
}

.theme-color-item:hover {
  border-color: var(--color-neutral-300);
}

.theme-color-item.active {
  border-color: var(--color-primary-500);
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-sm);
}

.theme-color-item span {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
}
</style>


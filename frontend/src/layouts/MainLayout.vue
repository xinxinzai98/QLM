<template>
  <el-container class="main-container">
    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile"
      class="sidebar-mask"
      :class="{ 'is-visible': !isCollapse && isMobile }"
      @click="toggleSidebar"
    ></div>
    
    <el-aside
      :width="isCollapse ? '64px' : '200px'"
      class="sidebar"
      :class="{ 'is-mobile-open': !isCollapse && isMobile }"
    >
      <div class="logo">
        <div class="logo-content">
          <div class="logo-icon">青</div>
          <div class="logo-text">
            <div class="logo-company">青绿氢能</div>
            <div class="logo-system">物料管理系统</div>
          </div>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        :collapse="isCollapse"
        :background-color="isCollapse ? 'transparent' : 'transparent'"
        text-color="rgba(255, 255, 255, 0.85)"
        active-text-color="#ffffff"
      >
        <!-- 核心功能组 -->
        <div class="menu-group" v-if="!isCollapse">
          <div class="menu-group-title">核心功能</div>
        </div>
        <el-menu-item 
          v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
          index="/dashboard"
        >
          <el-icon><DataBoard /></el-icon>
          <template #title>
            <span>仪表盘</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/materials">
          <el-icon><Box /></el-icon>
          <template #title>
            <span>物料管理</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><Document /></el-icon>
          <template #title>
            <span>出入库管理</span>
          </template>
        </el-menu-item>
        <el-menu-item 
          v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
          index="/stocktaking"
        >
          <el-icon><DocumentChecked /></el-icon>
          <template #title>
            <span>物料盘点</span>
          </template>
        </el-menu-item>

        <!-- 系统管理组 -->
        <div class="menu-group" v-if="!isCollapse && userStore.isSystemAdmin">
          <div class="menu-group-title">系统管理</div>
        </div>
        <el-menu-item 
          v-if="userStore.isSystemAdmin"
          index="/users"
        >
          <el-icon><User /></el-icon>
          <template #title>
            <span>用户管理</span>
          </template>
        </el-menu-item>
        <el-menu-item 
          v-if="userStore.isSystemAdmin"
          index="/operation-logs"
        >
          <el-icon><List /></el-icon>
          <template #title>
            <span>操作日志</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button
            text
            @click="toggleSidebar"
            class="sidebar-toggle-btn"
            :title="isCollapse ? '展开侧边栏' : '收起侧边栏'"
          >
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <!-- 快捷操作区 -->
          <div class="quick-actions">
            <el-button
              v-if="userStore.isSystemAdmin || userStore.isInventoryManager"
              text
              size="small"
              @click="handleQuickAction('material')"
              title="快速创建物料"
            >
              <el-icon><CirclePlus /></el-icon>
              <span class="quick-action-text">物料</span>
            </el-button>
            <el-button
              text
              size="small"
              @click="handleQuickAction('inventory')"
              title="快速创建出入库单"
            >
              <el-icon><DocumentAdd /></el-icon>
              <span class="quick-action-text">出入库</span>
            </el-button>
          </div>

          <!-- 全局搜索 -->
          <GlobalSearch ref="globalSearchRef" />

          <!-- 日期时间 -->
          <DateTimeClock />

          <!-- 消息中心 -->
          <NotificationCenter />

          <!-- 帮助中心 -->
          <el-button
            text
            size="small"
            @click="router.push('/help')"
            title="帮助中心"
            class="help-btn"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-button>

          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar 
                v-if="userStore.user?.avatar" 
                :src="userStore.user.avatar" 
                :size="32"
                style="margin-right: 8px;"
              />
              <el-icon v-else style="margin-right: 5px;"><Avatar /></el-icon>
              {{ userStore.user?.realName || userStore.user?.username }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessageBox } from 'element-plus';
import { Fold, Expand, CirclePlus, DocumentAdd, QuestionFilled, Setting } from '@element-plus/icons-vue';
import NotificationCenter from '@/components/NotificationCenter.vue';
import GlobalSearch from '@/components/GlobalSearch.vue';
import DateTimeClock from '@/components/DateTimeClock.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isCollapse = ref(false);
const activeMenu = computed(() => route.path);
const pageTitle = computed(() => route.meta.title || '物料管理系统');
const globalSearchRef = ref(null);

// 移动端检测
const isMobile = ref(false);
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  // 移动端默认收起侧边栏
  if (isMobile.value) {
    isCollapse.value = true;
  }
};

// 快捷键处理
const handleKeydown = (e) => {
  // Ctrl+K 或 Cmd+K 打开全局搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    globalSearchRef.value?.open();
  }
  // Ctrl+N 快速创建物料（管理员和库存管理员）
  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && (userStore.isSystemAdmin || userStore.isInventoryManager)) {
    e.preventDefault();
    handleQuickAction('material');
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('keydown', handleKeydown);
});

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value;
};

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout();
      router.push('/login');
    }).catch(() => {});
  } else if (command === 'profile') {
    router.push('/profile');
  } else if (command === 'settings') {
    router.push('/settings');
  }
};

const handleQuickAction = (type) => {
  if (type === 'material') {
    router.push('/materials?action=add');
  } else if (type === 'inventory') {
    router.push('/inventory?action=add');
  }
};
</script>

<style scoped>
.main-container {
  height: 100vh;
}

.sidebar {
  background: var(--gradient-sidebar);
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-base);
}

/* 移动端：侧边栏改为抽屉式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
  }

  .sidebar.is-mobile-open {
    transform: translateX(0);
  }

  /* 移动端遮罩层 */
  .sidebar-mask {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-base);
  }

  .sidebar-mask.is-visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: var(--transition-base);
}

.logo-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: 0 var(--spacing-4);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  box-shadow: var(--shadow-brand);
  transition: var(--transition-base);
}

.logo-icon:hover {
  box-shadow: var(--shadow-brand-lg);
  transform: scale(1.05);
}

.logo-text {
  flex: 1;
  min-width: 0;
}

.logo-company {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: white;
  line-height: var(--line-height-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logo-system {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.75);
  line-height: var(--line-height-tight);
  margin-top: var(--spacing-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: var(--spacing-2) 0;
}

/* 菜单分组标题 */
.menu-group {
  padding: var(--spacing-4) var(--spacing-4) var(--spacing-2);
  margin-top: var(--spacing-4);
}

.menu-group:first-child {
  margin-top: 0;
}

.menu-group-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 var(--spacing-2);
}

/* 菜单项样式增强 */
.sidebar-menu .el-menu-item {
  margin: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
  height: 44px;
  line-height: 44px;
  position: relative;
}

.sidebar-menu .el-menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--gradient-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: var(--transition-base);
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.95);
}

.sidebar-menu .el-menu-item:hover::before {
  height: 60%;
}

.sidebar-menu .el-menu-item.is-active {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-brand);
  font-weight: var(--font-weight-medium);
}

.sidebar-menu .el-menu-item.is-active::before {
  height: 100%;
  width: 4px;
}

.sidebar-menu .el-menu-item.is-active .el-icon {
  color: white;
}

.sidebar-menu .el-menu-item .el-icon {
  font-size: var(--font-size-lg);
  margin-right: var(--spacing-2);
  transition: var(--transition-base);
}

.sidebar-menu .el-menu-item:hover .el-icon {
  transform: scale(1.1);
}

.header {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--color-neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  box-shadow: var(--shadow-sm);
  z-index: 100;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.sidebar-toggle-btn {
  padding: var(--spacing-2);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
  color: var(--color-neutral-700);
}

.sidebar-toggle-btn:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary-600);
}

.page-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  margin-right: var(--spacing-2);
}

.quick-actions .el-button {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
}

.quick-actions .el-button:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary-600);
}

.quick-action-text {
  margin-left: var(--spacing-1);
}

.help-btn {
  padding: var(--spacing-2);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
  color: var(--color-neutral-700);
}

.help-btn:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary-600);
}

@media (max-width: 768px) {
  .quick-action-text {
    display: none;
  }
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--color-neutral-700);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
}

.user-info:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-primary-600);
}

.user-info .el-icon {
  margin-right: var(--spacing-2);
  transition: var(--transition-base);
}

.user-info:hover .el-icon--right {
  transform: rotate(180deg);
}

.main-content {
  background: var(--gradient-bg-light);
  padding: var(--spacing-6);
  overflow-y: auto;
  min-height: calc(100vh - 64px);
}
</style>


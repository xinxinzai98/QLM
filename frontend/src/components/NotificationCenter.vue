<template>
  <el-popover
    placement="bottom-end"
    :width="400"
    trigger="click"
    v-model:visible="visible"
    popper-class="notification-popover"
  >
    <template #reference>
      <div class="notification-trigger" @click="loadNotifications">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-icon :size="20" class="notification-icon">
            <Bell />
          </el-icon>
        </el-badge>
      </div>
    </template>

    <div class="notification-center">
      <div class="notification-header">
        <h3>消息中心</h3>
        <div class="header-actions">
          <el-button
            text
            size="small"
            @click="markAllAsRead"
            :disabled="unreadCount === 0"
          >
            全部已读
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all">
          <div class="notification-list" v-loading="loading">
            <div
              v-for="notification in notificationList"
              :key="notification.id"
              class="notification-item"
              :class="{ 'is-unread': !notification.is_read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper">
                <el-icon :size="20" :color="getNotificationColor(notification.type)">
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-text" v-if="notification.content">
                  {{ notification.content }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.created_at) }}
                </div>
              </div>
              <div class="notification-actions">
                <el-button
                  text
                  size="small"
                  @click.stop="deleteNotification(notification.id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty
              v-if="!loading && notificationList.length === 0"
              description="暂无消息"
              :image-size="80"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="待办" name="todo">
          <div class="notification-list" v-loading="loading">
            <div
              v-for="notification in todoList"
              :key="notification.id"
              class="notification-item"
              :class="{ 'is-unread': !notification.is_read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper">
                <el-icon :size="20" class="notification-icon-todo">
                  <Clock />
                </el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-text" v-if="notification.content">
                  {{ notification.content }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.created_at) }}
                </div>
              </div>
            </div>
            <el-empty
              v-if="!loading && todoList.length === 0"
              description="暂无待办"
              :image-size="80"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="系统公告" name="announcement">
          <div class="notification-list" v-loading="loading">
            <div
              v-for="notification in announcementList"
              :key="notification.id"
              class="notification-item"
              :class="{ 'is-unread': !notification.is_read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper">
                <el-icon :size="20" class="notification-icon-announcement">
                  <Message />
                </el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-text" v-if="notification.content">
                  {{ notification.content }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.created_at) }}
                </div>
              </div>
            </div>
            <el-empty
              v-if="!loading && announcementList.length === 0"
              description="暂无公告"
              :image-size="80"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Bell, Clock, Message, Delete, Warning, InfoFilled } from '@element-plus/icons-vue';
import { handleApiError, handleSuccess } from '@/utils/errorHandler';

const router = useRouter();
const visible = ref(false);
const loading = ref(false);
const activeTab = ref('all');
const notificationList = ref([]);
const unreadCount = ref(0);

// 计算属性：按类型过滤
const todoList = computed(() => 
  notificationList.value.filter(n => n.type === 'todo')
);

const announcementList = computed(() => 
  notificationList.value.filter(n => n.type === 'announcement')
);

// 加载通知列表
const loadNotifications = async () => {
  try {
    loading.value = true;
    const type = activeTab.value === 'all' ? undefined : activeTab.value;
    const response = await api.get('/notifications', {
      params: { type, pageSize: 50 }
    });
    
    if (response.data.success) {
      notificationList.value = response.data.data.list;
    }
  } catch (error) {
    handleApiError(error, '加载通知失败', false); // 后台加载，不显示错误
  } finally {
    loading.value = false;
  }
};

// 加载未读数量
const loadUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    if (response.data.success) {
      unreadCount.value = response.data.data.count;
    }
  } catch (error) {
    handleApiError(error, '加载未读数量失败', false); // 后台加载，不显示错误
  }
};

// 标记为已读
const markAsRead = async (id) => {
  try {
    await api.put(`/notifications/${id}/read`);
    const notification = notificationList.value.find(n => n.id === id);
    if (notification) {
      notification.is_read = 1;
      notification.read_at = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (error) {
    handleApiError(error, '标记已读失败', false); // 静默失败，不影响用户体验
  }
};

// 标记全部为已读
const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    notificationList.value.forEach(n => {
      n.is_read = 1;
      n.read_at = new Date().toISOString();
    });
    unreadCount.value = 0;
    handleSuccess('全部标记已读成功');
  } catch (error) {
    handleApiError(error, '标记已读失败');
  }
};

// 删除通知
const deleteNotification = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await api.delete(`/notifications/${id}`);
    notificationList.value = notificationList.value.filter(n => n.id !== id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 处理通知点击
const handleNotificationClick = async (notification) => {
  // 标记为已读
  if (!notification.is_read) {
    await markAsRead(notification.id);
  }

  // 如果有链接，跳转
  if (notification.link) {
    visible.value = false;
    if (notification.link_type === 'url' && notification.link.startsWith('http')) {
      window.open(notification.link, '_blank');
    } else {
      router.push(notification.link);
    }
  }
};

// 切换标签
const handleTabChange = () => {
  loadNotifications();
};

// 获取通知图标
const getNotificationIcon = (type) => {
  const iconMap = {
    system: InfoFilled,
    todo: Clock,
    announcement: Message
  };
  return iconMap[type] || InfoFilled;
};

// 获取通知颜色（使用CSS变量）
const getNotificationColor = (type) => {
  // 返回CSS变量名，由样式系统处理
  const colorMap = {
    system: 'var(--color-info-500)',
    todo: 'var(--color-warning-500)',
    announcement: 'var(--color-secondary-500)'
  };
  return colorMap[type] || 'var(--color-neutral-500)';
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const time = new Date(timeStr);
  const now = new Date();
  const diff = now - time;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return time.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 监听弹窗显示
watch(visible, (newVal) => {
  if (newVal) {
    loadNotifications();
  }
});

// 定期刷新未读数量
onMounted(() => {
  loadUnreadCount();
  // 每30秒刷新一次未读数量
  setInterval(() => {
    loadUnreadCount();
  }, 30000);
});
</script>

<style scoped>
.notification-trigger {
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-trigger:hover {
  background-color: var(--color-neutral-100);
}

.notification-icon {
  color: var(--color-neutral-700);
}

.notification-center {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
}

.notification-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-2);
}

.notification-item {
  display: flex;
  padding: var(--spacing-3);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-base);
  margin-bottom: var(--spacing-2);
  border: 1px solid transparent;
}

.notification-item:hover {
  background-color: var(--color-neutral-50);
  border-color: var(--color-neutral-200);
}

.notification-item.is-unread {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-200);
}

.notification-item.is-unread .notification-title {
  font-weight: var(--font-weight-semibold);
}

.notification-icon-wrapper {
  flex-shrink: 0;
  margin-right: var(--spacing-3);
  display: flex;
  align-items: flex-start;
  padding-top: var(--spacing-1);
}

.notification-icon-todo {
  color: var(--color-warning-500);
}

.notification-icon-announcement {
  color: var(--color-info-500);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-800);
  margin-bottom: var(--spacing-1);
  line-height: var(--line-height-normal);
}

.notification-text {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-1);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-400);
}

.notification-actions {
  flex-shrink: 0;
  margin-left: var(--spacing-2);
  opacity: 0;
  transition: var(--transition-base);
}

.notification-item:hover .notification-actions {
  opacity: 1;
}
</style>

<style>
.notification-popover {
  padding: 0 !important;
}

.notification-popover .el-tabs__header {
  margin: 0;
  padding: 0 var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
}

.notification-popover .el-tabs__content {
  padding: 0;
}
</style>



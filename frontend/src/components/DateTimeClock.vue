<template>
  <div class="datetime-clock">
    <div class="clock-display" @click="handleSyncTime" :title="syncTimeText">
      <el-icon class="clock-icon"><Clock /></el-icon>
      <span class="time-text">{{ currentTime }}</span>
    </div>
    <el-button
      text
      size="small"
      @click="handleSyncTime"
      :loading="syncing"
      class="sync-btn"
      title="同步时间"
    >
      <el-icon><Refresh /></el-icon>
      <span class="sync-text">对时</span>
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, Refresh } from '@element-plus/icons-vue';

const currentTime = ref('');
const syncing = ref(false);
const syncTimeText = ref('点击同步时间');

let timer = null;

// 格式化时间为 YYYY-MM-DD HH:mm:ss
const formatTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 更新时间
const updateTime = () => {
  currentTime.value = formatTime(new Date());
};

// 从公共时间API同步时间
const syncTime = async () => {
  syncing.value = true;
  try {
    let serverTime = null;
    
    // 使用公共时间API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Shanghai', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // worldtimeapi.org 返回格式: { datetime: "2024-01-01T12:00:00.123456+08:00" }
        if (data.datetime) {
          serverTime = new Date(data.datetime);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('时间API同步失败:', error);
      }
    }

    // 如果API调用失败，使用本地时间
    if (!serverTime) {
      serverTime = new Date();
      ElMessage.warning('无法连接到时间服务器，使用本地时间');
    }

    // 更新显示时间
    if (serverTime) {
      currentTime.value = formatTime(serverTime);
      syncTimeText.value = `已同步: ${currentTime.value}`;
      ElMessage.success('时间同步成功');
    }
  } catch (error) {
    console.error('时间同步失败:', error);
    ElMessage.error('时间同步失败，使用本地时间');
    updateTime(); // 失败时使用本地时间
  } finally {
    syncing.value = false;
  }
};

// 处理同步按钮点击
const handleSyncTime = async () => {
  await syncTime();
  // 同步后重新启动定时器
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(updateTime, 1000);
};

onMounted(() => {
  // 初始化显示
  updateTime();
  // 每秒更新
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped>
.datetime-clock {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-right: var(--spacing-2);
}

.clock-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-base);
  user-select: none;
}

.clock-display:hover {
  background-color: var(--color-neutral-100);
}

.clock-icon {
  font-size: var(--font-size-base);
  color: var(--color-primary-500);
}

.time-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.5px;
}

.sync-btn {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600);
  transition: var(--transition-base);
}

.sync-btn:hover {
  color: var(--color-primary-600);
  background-color: var(--color-neutral-100);
}

.sync-text {
  margin-left: var(--spacing-1);
}

/* 移动端隐藏对时按钮文字 */
@media (max-width: 768px) {
  .sync-text {
    display: none;
  }

  .time-text {
    font-size: var(--font-size-xs);
  }

  .clock-icon {
    font-size: var(--font-size-sm);
  }
}
</style>


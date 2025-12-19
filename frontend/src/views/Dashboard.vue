<template>
  <div class="dashboard">
    <!-- 面包屑导航 -->
    <Breadcrumb />

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="page-header-content">
        <div class="page-header-left">
          <h1 class="page-title">仪表盘</h1>
          <p class="page-description">查看系统概览和关键运营指标</p>
        </div>
        <div class="page-header-right">
          <DashboardCustomizer ref="customizerRef" />
        </div>
      </div>
    </div>

    <!-- 骨架屏加载 -->
    <el-row :gutter="20" class="stats-row" v-if="initialLoading">
      <el-col :xs="24" :sm="12" :md="6" v-for="i in 4" :key="`skeleton-stat-${i}`">
        <el-card class="stat-card">
          <el-skeleton :rows="0" animated>
            <template #template>
              <div class="stat-content">
                <el-skeleton-item variant="rect" style="width: 60px; height: 60px; border-radius: 8px;" />
                <div style="flex: 1; margin-left: 15px;">
                  <el-skeleton-item variant="h3" style="width: 60px; margin-bottom: 10px;" />
                  <el-skeleton-item variant="text" style="width: 80px;" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实际内容 -->
    <el-row :gutter="20" class="stats-row" v-if="!initialLoading && moduleVisibility.stats">
      <el-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in statsConfig" :key="stat.label">
        <el-card 
          class="stat-card" 
          shadow="hover"
          @click="handleStatClick(index)"
        >
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="30"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ 
                  index === 0 ? formatNumber(statsValues.totalMaterials) :
                  index === 1 ? formatNumber(statsValues.pendingTransactions) :
                  index === 2 ? formatNumber(statsValues.todayTransactions) :
                  formatNumber(statsValues.lowStockMaterials)
                }}
              </div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row" v-if="moduleVisibility.categoryChart || moduleVisibility.trendChart">
      <el-col :xs="24" :sm="24" :md="12" v-if="moduleVisibility.categoryChart">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><PieChart /></el-icon>
              <span>物料分类统计</span>
            </div>
          </template>
          <div v-loading="chartLoading" ref="categoryChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" v-if="moduleVisibility.trendChart">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><TrendCharts /></el-icon>
              <span>最近30天出入库趋势</span>
            </div>
          </template>
          <div v-loading="chartLoading" ref="trendChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tables-row" v-if="moduleVisibility.lowStock || moduleVisibility.pending">
      <el-col :xs="24" :sm="24" :md="12" v-if="moduleVisibility.lowStock">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><Warning /></el-icon>
              <span>低库存物料</span>
              <el-badge :value="lowStockMaterials.length" class="header-badge" v-if="lowStockMaterials.length > 0" />
            </div>
          </template>
          <el-table 
            :data="lowStockMaterials" 
            style="width: 100%" 
            size="small"
            v-loading="tableLoading"
            :empty-text="lowStockMaterials.length === 0 ? '暂无低库存物料' : ''"
          >
            <el-table-column prop="material_code" label="物料编码" width="120" />
            <el-table-column prop="material_name" label="物料名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="current_stock" label="当前库存" width="100">
              <template #default="{ row }">
                <span :class="{ 'low-stock-text': row.current_stock <= row.min_stock }">
                  {{ row.current_stock }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="min_stock" label="最低库存" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" v-if="moduleVisibility.pending">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header-with-icon">
              <el-icon><Clock /></el-icon>
              <span>待审批单</span>
              <el-badge :value="pendingTransactions.length" class="header-badge" v-if="pendingTransactions.length > 0" />
            </div>
          </template>
          <el-table 
            :data="pendingTransactions" 
            style="width: 100%" 
            size="small"
            v-loading="tableLoading"
            :empty-text="pendingTransactions.length === 0 ? '暂无待审批单' : ''"
          >
            <el-table-column prop="transaction_code" label="单号" width="150" show-overflow-tooltip />
            <el-table-column prop="material_name" label="物料名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="transaction_type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.transaction_type === 'in' ? 'success' : 'warning'" size="small">
                  {{ row.transaction_type === 'in' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="applicant_name" label="申请人" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import api from '@/utils/api';
import { ElMessage } from 'element-plus';
import { Box, Document, Warning, Clock, PieChart, TrendCharts } from '@element-plus/icons-vue';
import { handleApiError } from '@/utils/errorHandler';
import Breadcrumb from '@/components/Breadcrumb.vue';
import DashboardCustomizer from '@/components/DashboardCustomizer.vue';

// 颜色常量 - 对应 tokens.css
const COLORS = {
  primary: '#22c55e',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  bgCard: '#ffffff'
};

const iconMap = {
  Box,
  Document,
  Warning,
  Clock
};

const router = useRouter();

// 静态配置 - 不放入响应式对象中，避免Vue组件代理警告
const statsConfig = [
  { label: '物料总数', icon: Box, color: COLORS.primary },
  { label: '待审批单', icon: Clock, color: COLORS.warning },
  { label: '今日出入库', icon: Document, color: COLORS.success },
  { label: '低库存物料', icon: Warning, color: COLORS.error }
];

// 响应式数据
const statsValues = ref({
  totalMaterials: 0,
  pendingTransactions: 0,
  todayTransactions: 0,
  lowStockMaterials: 0
});

const categoryChartRef = ref(null);
const trendChartRef = ref(null);
const lowStockMaterials = ref([]);
const pendingTransactions = ref([]);
const initialLoading = ref(true);
const chartLoading = ref(false);
const tableLoading = ref(false);
const customizerRef = ref(null);

// 模块可见性配置
const moduleVisibility = ref({
  stats: true,
  categoryChart: true,
  trendChart: true,
  lowStock: true,
  pending: true
});

let categoryChart = null;
let trendChart = null;

// 加载布局配置
const loadLayoutConfig = () => {
  const saved = localStorage.getItem('dashboardLayout');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.forEach(config => {
        if (moduleVisibility.value.hasOwnProperty(config.id)) {
          moduleVisibility.value[config.id] = config.visible !== false;
        }
      });
    } catch (error) {
      console.error('加载布局配置失败:', error);
    }
  }
};

// 监听布局变化
const handleLayoutChange = () => {
  loadLayoutConfig();
  // 重新初始化图表
  nextTick(() => {
    initCharts();
  });
};

// 格式化数字（添加千分位）
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 处理统计卡片点击跳转
const handleStatClick = (index) => {
  const routes = [
    '/materials',           // 物料总数 -> 物料管理
    '/inventory?status=pending', // 待审批单 -> 出入库管理（筛选待审批）
    '/inventory',           // 今日出入库 -> 出入库管理
    '/materials?filter=lowStock' // 低库存物料 -> 物料管理（筛选低库存）
  ];
  
  if (routes[index]) {
    router.push(routes[index]);
  }
};

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    if (response.data.success) {
      const data = response.data.data;
      statsValues.value.totalMaterials = data.totalMaterials || 0;
      statsValues.value.pendingTransactions = data.pendingTransactions || 0;
      statsValues.value.todayTransactions = data.todayTransactions || 0;
      statsValues.value.lowStockMaterials = data.lowStockMaterials || 0;
    }
  } catch (error) {
    handleApiError(error, '获取统计数据失败');
  } finally {
    initialLoading.value = false;
  }
};

// 获取物料分类统计
const fetchCategoryStats = async () => {
  chartLoading.value = true;
  try {
    const response = await api.get('/dashboard/materials-by-category');
    if (response.data.success) {
      const data = response.data.data;
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '物料分类',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: COLORS.bgCard,
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            data: data.map(item => ({
              value: item.count,
              name: item.category === 'chemical' ? '化学物料' : '金属物料'
            }))
          }
        ]
      };
      if (categoryChart) {
        categoryChart.setOption(option);
      }
    }
  } catch (error) {
    handleApiError(error, '获取分类统计失败');
  } finally {
    chartLoading.value = false;
  }
};

// 获取出入库趋势
const fetchTrend = async () => {
  chartLoading.value = true;
  try {
    const response = await api.get('/dashboard/transaction-trend');
    if (response.data.success) {
      const data = response.data.data;
      const dates = [...new Set(data.map(item => item.date))].sort();
      const inData = dates.map(date => {
        const item = data.find(d => d.date === date && d.transaction_type === 'in');
        return item ? item.count : 0;
      });
      const outData = dates.map(date => {
        const item = data.find(d => d.date === date && d.transaction_type === 'out');
        return item ? item.count : 0;
      });

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['入库', '出库'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [
          {
            name: '入库',
            type: 'line',
            data: inData,
            smooth: true,
            areaStyle: {
              opacity: 0.4,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: COLORS.success },
                  { offset: 1, color: 'rgba(34, 197, 94, 0.1)' }
                ]
              }
            },
            itemStyle: {
              color: COLORS.success,
              borderWidth: 2,
              borderColor: '#fff'
            },
            lineStyle: {
              width: 3,
              shadowBlur: 4,
              shadowColor: 'rgba(34, 197, 94, 0.3)'
            },
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
              focus: 'series',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(34, 197, 94, 0.5)'
              }
            }
          },
          {
            name: '出库',
            type: 'line',
            data: outData,
            smooth: true,
            areaStyle: {
              opacity: 0.4,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: COLORS.warning },
                  { offset: 1, color: 'rgba(245, 158, 11, 0.1)' }
                ]
              }
            },
            itemStyle: {
              color: COLORS.warning,
              borderWidth: 2,
              borderColor: '#fff'
            },
            lineStyle: {
              width: 3,
              shadowBlur: 4,
              shadowColor: 'rgba(34, 197, 94, 0.3)'
            },
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
              focus: 'series',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(34, 197, 94, 0.5)'
              }
            }
          },
          {
            name: '出库',
            type: 'line',
            data: outData,
            smooth: true,
            areaStyle: {
              opacity: 0.4,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: COLORS.warning },
                  { offset: 1, color: 'rgba(245, 158, 11, 0.1)' }
                ]
              }
            },
            itemStyle: {
              color: COLORS.warning,
              borderWidth: 2,
              borderColor: '#fff'
            },
            lineStyle: {
              width: 3,
              shadowBlur: 4,
              shadowColor: 'rgba(245, 158, 11, 0.3)'
            },
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
              focus: 'series',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(245, 158, 11, 0.5)'
              }
            }
          }
        ],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      };
      if (trendChart) {
        trendChart.setOption(option);
      }
    }
  } catch (error) {
    handleApiError(error, '获取趋势数据失败');
  } finally {
    chartLoading.value = false;
  }
};

// 获取低库存物料
const fetchLowStockMaterials = async () => {
  tableLoading.value = true;
  try {
    const response = await api.get('/dashboard/low-stock-materials');
    if (response.data.success) {
      lowStockMaterials.value = response.data.data;
    }
  } catch (error) {
    handleApiError(error, '获取低库存物料失败');
  } finally {
    tableLoading.value = false;
  }
};

// 获取待审批单
const fetchPendingTransactions = async () => {
  tableLoading.value = true;
  try {
    const response = await api.get('/dashboard/pending-transactions');
    if (response.data.success) {
      pendingTransactions.value = response.data.data;
    }
  } catch (error) {
    handleApiError(error, '获取待审批单失败');
  } finally {
    tableLoading.value = false;
  }
};

// 初始化图表
const initCharts = async () => {
  await nextTick();
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value);
    fetchCategoryStats();
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    fetchTrend();
  }
};

// 窗口大小改变时重新调整图表
const handleResize = () => {
  if (categoryChart) categoryChart.resize();
  if (trendChart) trendChart.resize();
};

onMounted(() => {
  loadLayoutConfig();
  fetchStats();
  fetchLowStockMaterials();
  fetchPendingTransactions();
  initCharts();
  window.addEventListener('resize', handleResize);
  window.addEventListener('dashboard-layout-changed', handleLayoutChange);
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('dashboard-layout-changed', handleLayoutChange);
  if (categoryChart) categoryChart.dispose();
  if (trendChart) trendChart.dispose();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-4);
}

/* 页面标题区域 */
.page-header {
  margin-bottom: var(--spacing-8);
  padding-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--color-neutral-200);
}

.page-header-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.page-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-900);
  margin: 0;
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

.stats-row {
  margin-bottom: var(--spacing-6);
}

.stat-card {
  margin-bottom: var(--spacing-6);
  transition: var(--transition-base);
  cursor: pointer;
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-200);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: var(--spacing-4);
  box-shadow: var(--shadow-base);
  transition: var(--transition-base);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-md);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-900);
  margin-bottom: var(--spacing-2);
  line-height: var(--line-height-tight);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-600);
  font-weight: var(--font-weight-medium);
}

.charts-row {
  margin-bottom: var(--spacing-6);
}

.tables-row {
  margin-bottom: var(--spacing-6);
}

.card-header-with-icon {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-800);
}

.card-header-with-icon .el-icon {
  color: var(--color-primary-500);
  font-size: var(--font-size-lg);
}

.header-badge {
  margin-left: auto;
}

.low-stock-text {
  color: var(--color-error-600);
  font-weight: var(--font-weight-semibold);
}

.chart-container {
  height: 300px;
  min-height: 300px;
}

.chart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 响应式优化 */
@media (max-width: 1024px) {
  .dashboard {
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
  .stat-card {
    margin-bottom: var(--spacing-4);
  }
  
  .stat-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stat-icon {
    margin-bottom: var(--spacing-3);
    margin-right: 0;
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
/* 页面标题区域 - 统一页面风格 */
.page-header {
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
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

/* 响应式优化 */
@media (max-width: 1024px) {
  .page-header {
    margin-bottom: var(--spacing-6);
    padding-bottom: var(--spacing-4);
  }

  .page-title {
    font-size: var(--font-size-h3);
  }
}

@media (max-width: 768px) {
  .page-header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-right {
    width: 100%;
    margin-top: var(--spacing-3);
    justify-content: flex-end;
  }
}
</style>


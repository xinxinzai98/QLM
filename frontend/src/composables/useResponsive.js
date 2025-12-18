/**
 * 响应式工具函数
 * 提供屏幕尺寸检测和响应式布局相关的计算属性
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useResponsive() {
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  const checkScreen = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth;
    }
  };
  
  onMounted(() => {
    checkScreen();
    window.addEventListener('resize', checkScreen);
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkScreen);
  });
  
  // 屏幕尺寸判断
  const isMobile = computed(() => windowWidth.value < 768);
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024);
  const isDesktop = computed(() => windowWidth.value >= 1024);
  
  // 对话框宽度：移动端95%，平板80%，桌面600px
  const dialogWidth = computed(() => {
    if (isMobile.value) return '95%';
    if (isTablet.value) return '80%';
    return '600px';
  });
  
  // 大对话框宽度：用于需要更大空间的对话框
  const dialogWidthLarge = computed(() => {
    if (isMobile.value) return '95%';
    if (isTablet.value) return '90%';
    return '800px';
  });
  
  // 表单 label-width：移动端80px，桌面100px
  const formLabelWidth = computed(() => {
    return isMobile.value ? '80px' : '100px';
  });
  
  // Descriptions 列数：移动端1列，桌面2列
  const descriptionColumns = computed(() => {
    return isMobile.value ? 1 : 2;
  });
  
  // Popover 宽度：移动端自适应，桌面400px
  const popoverWidth = computed(() => {
    if (isMobile.value) {
      return Math.min(windowWidth.value - 32, 400);
    }
    return 400;
  });
  
  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    dialogWidth,
    dialogWidthLarge,
    formLabelWidth,
    descriptionColumns,
    popoverWidth
  };
}


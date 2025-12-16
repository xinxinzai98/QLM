import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api';

export const useUserStore = defineStore('user', () => {
  // 兼容旧版本：优先使用accessToken，如果没有则使用token
  const accessToken = ref(localStorage.getItem('accessToken') || localStorage.getItem('token') || '');
  const refreshToken = ref(localStorage.getItem('refreshToken') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  // 兼容性：提供token属性（指向accessToken）
  const token = computed(() => accessToken.value);

  const isAuthenticated = computed(() => !!accessToken.value);
  
  const userRole = computed(() => user.value?.role || '');
  const isSystemAdmin = computed(() => userRole.value === 'system_admin');
  const isInventoryManager = computed(() => userRole.value === 'inventory_manager');
  const isRegularUser = computed(() => userRole.value === 'regular_user');

  // 设置Access Token
  function setAccessToken(token) {
    accessToken.value = token;
    localStorage.setItem('accessToken', token);
    // 保留旧token字段以兼容
    localStorage.setItem('token', token);
  }

  // 登录
  async function login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        // 保存Access Token和Refresh Token
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data.data;
        
        setAccessToken(newAccessToken);
        refreshToken.value = newRefreshToken;
        user.value = userData;
        
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(user.value));
        
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败，请检查网络连接' 
      };
    }
  }

  // 登出
  async function logout() {
    try {
      // 调用后端登出接口清除Refresh Token
      await api.post('/auth/logout');
    } catch (error) {
      // 即使登出接口失败，也清除本地数据
      console.error('登出接口调用失败:', error);
    } finally {
      accessToken.value = '';
      refreshToken.value = '';
      user.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        user.value = response.data.data;
        // 处理头像路径
        if (user.value.avatar && !user.value.avatar.startsWith('http')) {
          user.value.avatar = `/api${user.value.avatar}`;
        }
        localStorage.setItem('user', JSON.stringify(user.value));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      logout();
    }
  }

  return {
    token, // 兼容性：指向accessToken
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    userRole,
    isSystemAdmin,
    isInventoryManager,
    isRegularUser,
    setAccessToken,
    login,
    logout,
    fetchCurrentUser
  };
});


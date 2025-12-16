import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    // 使用accessToken（如果存在）
    const token = userStore.accessToken || userStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器（支持Token自动刷新）
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const userStore = useUserStore();

      if (status === 401) {
        // 排除特殊路径,避免无限循环
        const skipLogoutPaths = ['/auth/logout', '/auth/login', '/auth/refresh'];
        const requestPath = error.config?.url || '';
        const shouldSkipLogout = skipLogoutPaths.some(path => requestPath.includes(path));

        if (shouldSkipLogout) {
          // 这些路径的401错误不触发自动logout,直接返回错误
          return Promise.reject(error);
        }

        // Access Token过期，尝试使用Refresh Token刷新
        if (userStore.refreshToken && !error.config._retry) {
          error.config._retry = true;

          try {
            // 调用刷新Token接口
            const refreshResponse = await api.post('/auth/refresh', {
              refreshToken: userStore.refreshToken
            });

            if (refreshResponse.data.success) {
              // 更新Access Token
              userStore.setAccessToken(refreshResponse.data.data.accessToken);

              // 重试原始请求
              error.config.headers.Authorization = `Bearer ${refreshResponse.data.data.accessToken}`;
              return api(error.config);
            }
          } catch (refreshError) {
            // Refresh Token也失效，需要重新登录
            userStore.logout();
            ElMessage.error('登录已过期，请重新登录');
            router.push('/login');
            return Promise.reject(refreshError);
          }
        } else {
          // 没有Refresh Token或刷新失败，跳转登录
          userStore.logout();
          ElMessage.error('登录已过期，请重新登录');
          router.push('/login');
        }
      } else if (status === 403) {
        ElMessage.error(data.message || '权限不足');
      } else if (status >= 500) {
        ElMessage.error('服务器错误，请稍后重试');
      } else {
        ElMessage.error(data.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);


export default api;

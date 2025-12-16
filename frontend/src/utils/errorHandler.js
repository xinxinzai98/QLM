/**
 * 统一错误处理工具
 * 用于统一处理API错误和业务错误，提供友好的用户提示
 */

import { ElMessage } from 'element-plus';

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 默认错误消息
 * @param {boolean} showMessage - 是否显示错误提示（默认true）
 * @returns {string} 错误消息
 */
export function handleApiError(error, defaultMessage = '操作失败，请稍后重试', showMessage = true) {
  let message = defaultMessage;

  if (error.response) {
    // 服务器返回了错误响应
    const { status, data } = error.response;
    
    if (data && data.message) {
      message = data.message;
    } else if (status === 401) {
      message = '登录已过期，请重新登录';
    } else if (status === 403) {
      message = '权限不足，无法执行此操作';
    } else if (status === 404) {
      message = '请求的资源不存在';
    } else if (status >= 500) {
      message = '服务器错误，请稍后重试';
    } else {
      message = '请求失败，请检查网络连接';
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    message = '网络错误，请检查网络连接';
  } else {
    // 其他错误
    message = error.message || defaultMessage;
  }

  if (showMessage) {
    ElMessage.error(message);
  }

  // 开发环境下输出详细错误信息
  if (import.meta.env.DEV) {
    console.error('API Error:', {
      message,
      error,
      response: error.response,
      request: error.request
    });
  }

  return message;
}

/**
 * 处理业务错误（非API错误）
 * @param {string} message - 错误消息
 * @param {boolean} showMessage - 是否显示错误提示（默认true）
 */
export function handleBusinessError(message, showMessage = true) {
  if (showMessage) {
    ElMessage.error(message);
  }
  
  if (import.meta.env.DEV) {
    console.error('Business Error:', message);
  }
}

/**
 * 处理成功消息
 * @param {string} message - 成功消息
 */
export function handleSuccess(message) {
  ElMessage.success(message);
}





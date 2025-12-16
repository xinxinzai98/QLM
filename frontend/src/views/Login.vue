<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-logo">
          <div class="logo-icon">青</div>
        </div>
        <h2 class="login-title">青绿氢能</h2>
        <p class="login-subtitle">物料管理系统</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        <p>默认管理员账户：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const result = await userStore.login(loginForm.username, loginForm.password);
        if (result.success) {
          ElMessage.success('登录成功');
          // 检查是否是首次登录（用于显示引导）
          const hasSeenGuide = localStorage.getItem('hasSeenGuide');
          if (!hasSeenGuide) {
            localStorage.setItem('isFirstLogin', 'true');
          }
          // 根据角色跳转：普通人员跳转到物料管理，其他角色跳转到仪表盘
          if (userStore.isRegularUser) {
            router.push('/materials');
          } else {
            router.push('/dashboard');
          }
        } else {
          ElMessage.error(result.message || '登录失败');
        }
      } catch (error) {
        ElMessage.error('登录失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-6);
  position: relative;
  overflow: hidden;
  /* 模拟山和云朵的背景效果 */
  background: linear-gradient(
    180deg,
    #87CEEB 0%,
    #B0E0E6 30%,
    #ADD8E6 50%,
    #4682B4 70%,
    #2F4F4F 100%
  );
  background-size: 100% 100%;
  animation: skyShift 20s ease infinite;
}

/* 天空背景动画 */
@keyframes skyShift {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* 云朵效果 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 60% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 40%, rgba(255, 255, 255, 0.35) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.25) 0%, transparent 50%);
  animation: cloudFloat 30s ease-in-out infinite;
  pointer-events: none;
}

@keyframes cloudFloat {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  33% {
    transform: translateX(30px) translateY(-20px);
  }
  66% {
    transform: translateX(-20px) translateY(10px);
  }
}

/* 山脉效果 */
.login-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: 
    linear-gradient(to top, rgba(70, 130, 180, 0.8) 0%, transparent 100%),
    linear-gradient(135deg, rgba(47, 79, 79, 0.6) 0%, rgba(70, 130, 180, 0.4) 100%);
  clip-path: polygon(
    0% 100%,
    10% 85%,
    20% 90%,
    30% 75%,
    40% 80%,
    50% 70%,
    60% 75%,
    70% 65%,
    80% 70%,
    90% 80%,
    100% 75%,
    100% 100%
  );
  z-index: 0;
}

.login-box {
  width: 100%;
  max-width: 480px;
  padding: var(--spacing-10) var(--spacing-8);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5);
  position: relative;
  z-index: 1;
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.login-logo {
  margin-bottom: var(--spacing-4);
  display: flex;
  justify-content: center;
}

.login-logo .logo-icon {
  width: 72px;
  height: 72px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  box-shadow: 
    0 8px 24px rgba(34, 197, 94, 0.3),
    0 0 0 4px rgba(34, 197, 94, 0.1);
  transition: var(--transition-base);
}

.login-logo .logo-icon:hover {
  transform: scale(1.05) rotate(5deg);
  box-shadow: 
    0 12px 32px rgba(34, 197, 94, 0.4),
    0 0 0 6px rgba(34, 197, 94, 0.15);
}

.login-title {
  color: var(--color-neutral-800);
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin: 0;
  margin-bottom: var(--spacing-2);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.login-subtitle {
  color: var(--color-neutral-600);
  font-size: var(--font-size-base);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

.login-form {
  margin-top: var(--spacing-6);
}

.login-form :deep(.el-form-item__label) {
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-medium);
}

.login-form :deep(.el-input__wrapper) {
  background-color: #ffffff;
  border: 1px solid var(--color-neutral-200);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: var(--transition-base);
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: var(--color-primary-400);
  box-shadow: 0 4px 8px rgba(34, 197, 94, 0.1);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.login-form :deep(.el-button--primary) {
  height: 48px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 1px;
  text-transform: uppercase;
  border-radius: var(--radius-base);
  box-shadow: 
    0 4px 12px rgba(34, 197, 94, 0.3),
    0 2px 4px rgba(34, 197, 94, 0.2);
  transition: var(--transition-base);
}

.login-form :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(34, 197, 94, 0.4),
    0 4px 8px rgba(34, 197, 94, 0.3);
}

.login-form :deep(.el-button--primary:active) {
  transform: translateY(0);
}

.login-tip {
  margin-top: var(--spacing-6);
  text-align: center;
  color: var(--color-neutral-500);
  font-size: var(--font-size-xs);
  padding: var(--spacing-3);
  background: rgba(34, 197, 94, 0.05);
  border-radius: var(--radius-base);
  border: 1px solid rgba(34, 197, 94, 0.1);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .login-box {
    max-width: 100%;
    padding: var(--spacing-8) var(--spacing-6);
  }
  
  .login-title {
    font-size: var(--font-size-h2);
  }
}
</style>


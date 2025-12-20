import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: (to) => {
      const userStore = useUserStore();
      // 普通人员默认跳转到物料管理，其他角色跳转到仪表盘
      if (userStore.isRegularUser) {
        return '/materials';
      }
      return '/dashboard';
    },
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { 
          title: '仪表盘', 
          requiresAuth: true,
          roles: ['system_admin', 'inventory_manager']
        }
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/Materials.vue'),
        meta: { title: '物料管理', requiresAuth: true }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/Inventory.vue'),
        meta: { title: '出入库管理', requiresAuth: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { 
          title: '用户管理', 
          requiresAuth: true,
          roles: ['system_admin']
        }
      },
      {
        path: 'stocktaking',
        name: 'Stocktaking',
        component: () => import('@/views/Stocktaking.vue'),
        meta: { 
          title: '物料盘点', 
          requiresAuth: true,
          roles: ['system_admin', 'inventory_manager']
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { 
          title: '个人中心', 
          requiresAuth: true
        }
      },
      {
        path: 'operation-logs',
        name: 'OperationLogs',
        component: () => import('@/views/OperationLogs.vue'),
        meta: { 
          title: '操作日志', 
          requiresAuth: true,
          roles: ['system_admin']
        }
      },
      {
        path: 'admin/data-management',
        name: 'DataManagement',
        component: () => import('@/views/DataManagement.vue'),
        meta: { 
          title: '数据管理', 
          requiresAuth: true,
          roles: ['system_admin']
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { 
          title: '系统设置', 
          requiresAuth: true
        }
      },
      {
        path: 'help',
        name: 'Help',
        component: () => import('@/views/Help.vue'),
        meta: { 
          title: '帮助中心', 
          requiresAuth: true
        }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.roles && !to.meta.roles.includes(userStore.user?.role)) {
    // 权限不足，根据角色跳转
    if (userStore.isRegularUser) {
      // 普通人员跳转到物料管理
      next('/materials');
    } else {
      // 其他角色跳转到仪表盘
      next('/dashboard');
    }
  } else if (to.path === '/login' && userStore.isAuthenticated) {
    // 已登录，根据角色跳转
    if (userStore.isRegularUser) {
      next('/materials');
    } else {
      next('/dashboard');
    }
  } else {
    next();
  }
});

export default router;


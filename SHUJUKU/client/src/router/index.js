import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataLine' }
      },
      {
        path: 'clubs',
        name: 'Clubs',
        component: () => import('@/views/clubs/ClubList.vue'),
        meta: { title: '社团管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'clubs/:id',
        name: 'ClubDetail',
        component: () => import('@/views/clubs/ClubDetail.vue'),
        meta: { title: '社团详情', hidden: true }
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activities/ActivityList.vue'),
        meta: { title: '活动管理', icon: 'Calendar' }
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/activities/ActivityDetail.vue'),
        meta: { title: '活动详情', hidden: true }
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('@/views/approvals/ApprovalList.vue'),
        meta: { title: '审批管理', icon: 'DocumentChecked', roles: ['super_admin', 'teacher'] }
      },
      {
        path: 'funds',
        name: 'Funds',
        component: () => import('@/views/funds/FundList.vue'),
        meta: { title: '经费管理', icon: 'Wallet' }
      },
      {
        path: 'equipment',
        name: 'Equipment',
        component: () => import('@/views/equipment/EquipmentList.vue'),
        meta: { title: '物资管理', icon: 'Box' }
      },
      {
        path: 'credits',
        name: 'Credits',
        component: () => import('@/views/credits/CreditList.vue'),
        meta: { title: '积分管理', icon: 'Star' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['super_admin'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', hidden: true }
      }
    ]
  },
  {
    path: '/checkin/:activityId/:token',
    name: 'Checkin',
    component: () => import('@/views/Checkin.vue'),
    meta: { requiresAuth: true, title: '活动签到' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 校园社团管理系统` : '校园社团管理系统'

  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !userStore.token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && userStore.token) {
    next({ path: '/' })
  } else {
    if (to.meta.roles && userStore.userInfo) {
      const hasRole = to.meta.roles.includes(userStore.userInfo.role)
      if (!hasRole) {
        next({ path: '/dashboard' })
        return
      }
    }
    next()
  }
})

export default router

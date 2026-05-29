import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const login = async (loginForm) => {
    const res = await authApi.login(loginForm)
    token.value = res.data.token
    userInfo.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error(e)
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const getUserInfo = async () => {
    const res = await authApi.getMe()
    userInfo.value = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
    return res.data
  }

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data)
    if (res.success) {
      await getUserInfo()
    }
    return res
  }

  const isAdmin = () => {
    return userInfo.value?.role === 'super_admin'
  }

  const isTeacher = () => {
    return userInfo.value?.role === 'teacher'
  }

  const canApprove = () => {
    return isAdmin() || isTeacher()
  }

  const isClubPresident = (clubId) => {
    if (isAdmin()) return true
    const club = userInfo.value?.clubs?.find(c => c.clubId === clubId)
    return club?.role === 'president'
  }

  const isClubMember = (clubId) => {
    if (isAdmin() || isTeacher()) return true
    return userInfo.value?.clubs?.some(c => c.clubId === clubId)
  }

  return {
    token,
    userInfo,
    login,
    logout,
    getUserInfo,
    updateProfile,
    isAdmin,
    isTeacher,
    canApprove,
    isClubPresident,
    isClubMember
  }
})

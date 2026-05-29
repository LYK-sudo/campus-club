<template>
  <div class="checkin-page">
    <el-result
      v-if="status === 'success'"
      icon="success"
      title="签到成功"
      :sub-title="message"
    />
    <el-result
      v-else-if="status === 'error'"
      icon="error"
      title="签到失败"
      :sub-title="message"
    />
    <el-result
      v-else
      icon="info"
      title="正在签到..."
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { activityApi } from '@/api'

const route = useRoute()
const router = useRouter()

const status = ref('loading')
const message = ref('')

const doCheckin = async () => {
  try {
    const { activityId, token } = route.params
    await activityApi.checkin(activityId, { token })
    status.value = 'success'
    message.value = '您已成功完成活动签到'
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
  } catch (error) {
    status.value = 'error'
    message.value = error.response?.data?.message || '签到失败，请重试'
  }
}

onMounted(() => {
  doCheckin()
})
</script>

<style scoped>
.checkin-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
}
</style>

<template>
  <div class="activity-detail">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <span>{{ activity.title }}</span>
      </template>
    </el-page-header>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>活动信息</span>
              <div>
                <el-button v-if="canSubmit" type="warning" @click="handleSubmitApproval">提交审批</el-button>
                <el-button v-if="canRegister" type="primary" @click="handleRegister">立即报名</el-button>
                <el-button v-if="isRegistered" type="danger" @click="handleCancelRegister">取消报名</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="活动名称">{{ activity.title }}</el-descriptions-item>
            <el-descriptions-item label="活动类型">{{ typeText[activity.type] }}</el-descriptions-item>
            <el-descriptions-item label="所属社团">{{ activity.club_name }}</el-descriptions-item>
            <el-descriptions-item label="活动地点">{{ activity.location }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDate(activity.start_time) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDate(activity.end_time) }}</el-descriptions-item>
            <el-descriptions-item label="报名人数">
              {{ activity.current_participants }} / {{ activity.max_participants || '不限' }}
            </el-descriptions-item>
            <el-descriptions-item label="活动积分">{{ activity.credit_points }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[activity.status]">{{ statusText[activity.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(activity.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="活动详情" :span="2">{{ activity.description }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>报名名单</span>
          </template>
          <el-table :data="activity.registrations || []" stripe max-height="400">
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="student_no" label="学号" width="120" />
            <el-table-column prop="department" label="院系" />
            <el-table-column prop="register_time" label="报名时间" width="180">
              <template #default="{ row }">{{ formatDate(row.register_time) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'checked_in' ? 'success' : ''">
                  {{ row.status === 'checked_in' ? '已签到' : '已报名' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>活动状态</span>
          </template>
          <el-steps :active="getStepActive()" direction="vertical" finish-status="success">
            <el-step title="创建活动" :description="formatDate(activity.created_at)" />
            <el-step title="提交审批" />
            <el-step title="审批通过" />
            <el-step title="活动进行" />
            <el-step title="活动结束" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { activityApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()

const activity = ref({})

const typeText = { lecture: '讲座', volunteer: '志愿', competition: '比赛', party: '聚会', sports: '体育', other: '其他' }
const statusText = { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已拒绝', ongoing: '进行中', completed: '已完成', cancelled: '已取消' }
const statusType = { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', ongoing: 'primary', completed: 'success', cancelled: 'info' }

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const canSubmit = computed(() => activity.value.status === 'draft' && userStore.isClubPresident(activity.value.club_id))
const canRegister = computed(() => activity.value.status === 'approved' && !activity.value.user_registered)
const isRegistered = computed(() => activity.value.user_registered)

const getStepActive = () => {
  const statusMap = { draft: 0, pending: 1, approved: 2, ongoing: 3, completed: 4, rejected: 1, cancelled: 1 }
  return statusMap[activity.value.status] || 0
}

const loadActivity = async () => {
  try {
    const res = await activityApi.getById(route.params.id)
    activity.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleSubmitApproval = async () => {
  try {
    await ElMessageBox.confirm('确定要提交审批吗？', '提示')
    await activityApi.submit(route.params.id)
    ElMessage.success('已提交审批')
    loadActivity()
  } catch (error) {
    console.error(error)
  }
}

const handleRegister = async () => {
  try {
    await activityApi.register(route.params.id)
    ElMessage.success('报名成功')
    loadActivity()
  } catch (error) {
    console.error(error)
  }
}

const handleCancelRegister = async () => {
  try {
    await ElMessageBox.confirm('确定要取消报名吗？', '提示')
    await activityApi.cancelRegister(route.params.id)
    ElMessage.success('已取消报名')
    loadActivity()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadActivity()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

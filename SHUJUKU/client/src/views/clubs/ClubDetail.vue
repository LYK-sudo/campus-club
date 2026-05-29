<template>
  <div class="club-detail">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <span class="text-large font-600 mr-3">{{ club.name }}</span>
      </template>
    </el-page-header>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>社团信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="社团名称">{{ club.name }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ club.category }}</el-descriptions-item>
            <el-descriptions-item label="成员数">{{ club.total_members }} / {{ club.max_members }}</el-descriptions-item>
            <el-descriptions-item label="经费余额">¥{{ club.budget?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[club.status]">{{ statusText[club.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="成立时间">{{ formatDate(club.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="简介" :span="2">{{ club.description }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>成员列表</span>
              <el-button type="primary" size="small" v-if="canManage" @click="handleAddMember">
                添加成员
              </el-button>
            </div>
          </template>
          <el-table :data="club.members || []" stripe max-height="400">
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="student_no" label="学号" width="120" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="roleType[row.role]">{{ roleText[row.role] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="院系" />
            <el-table-column prop="points" label="积分" width="80" />
            <el-table-column prop="join_date" label="入团日期" width="120" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>近期活动</span>
          </template>
          <el-empty v-if="!club.recent_activities?.length" description="暂无活动" />
          <div v-else>
            <div v-for="activity in club.recent_activities" :key="activity.id" class="activity-item">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-info">
                <span>{{ formatDate(activity.start_time) }}</span>
                <el-tag size="small" :type="activityStatusType[activity.status]">
                  {{ activityStatusText[activity.status] }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="memberDialogVisible" title="添加成员" width="400px">
      <el-form ref="memberFormRef" :model="memberForm" :rules="memberRules" label-width="80px">
        <el-form-item label="学号" prop="student_no">
          <el-input v-model="memberForm.student_no" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="memberForm.role" style="width: 100%">
            <el-option label="普通成员" value="member" />
            <el-option label="副会长" value="vice_president" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { clubApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()

const club = ref({})
const memberDialogVisible = ref(false)
const memberFormRef = ref(null)

const memberForm = reactive({
  student_no: '',
  role: 'member'
})

const memberRules = {
  student_no: [{ required: true, message: '请输入学号', trigger: 'blur' }]
}

const statusText = { active: '正常', suspended: '暂停', disbanded: '解散' }
const statusType = { active: 'success', suspended: 'warning', disbanded: 'danger' }
const roleText = { president: '负责人', vice_president: '副会长', member: '成员' }
const roleType = { president: 'danger', vice_president: 'warning', member: '' }
const activityStatusText = { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已拒绝', ongoing: '进行中', completed: '已完成', cancelled: '已取消' }
const activityStatusType = { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', ongoing: 'primary', completed: 'success', cancelled: 'info' }

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const canManage = computed(() => userStore.isAdmin() || userStore.isClubPresident(route.params.id))

const loadClub = async () => {
  try {
    const res = await clubApi.getById(route.params.id)
    club.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const handleAddMember = () => {
  memberForm.student_no = ''
  memberForm.role = 'member'
  memberDialogVisible.value = true
}

const handleSubmitMember = async () => {
  const valid = await memberFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    const users = await userApi.getList({ keyword: memberForm.student_no, pageSize: 1 })
    if (!users.data.list.length) {
      ElMessage.error('该学号不存在')
      return
    }
    
    await clubApi.addMember(route.params.id, {
      user_id: users.data.list[0].id,
      role: memberForm.role
    })
    ElMessage.success('添加成功')
    memberDialogVisible.value = false
    loadClub()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadClub()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.activity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}
</style>

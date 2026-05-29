<template>
  <div class="activity-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活动列表</span>
          <el-button type="primary" @click="handleAdd">发布活动</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="活动名称" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="title" label="活动名称" min-width="200" />
        <el-table-column prop="club_name" label="所属社团" width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ typeText[row.type] }}</template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">{{ formatDate(row.start_time) }}</template>
        </el-table-column>
        <el-table-column prop="current_participants" label="报名人数" width="100">
          <template #default="{ row }">
            {{ row.current_participants }} / {{ row.max_participants || '不限' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="发布活动" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属社团" prop="club_id">
              <el-select v-model="form.club_id" style="width: 100%">
                <el-option v-for="club in myClubs" :key="club.clubId" :label="club.clubName" :value="club.clubId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="type">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="讲座" value="lecture" />
                <el-option label="志愿" value="volunteer" />
                <el-option label="比赛" value="competition" />
                <el-option label="聚会" value="party" />
                <el-option label="体育" value="sports" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker v-model="form.start_time" type="datetime" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker v-model="form.end_time" type="datetime" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="人数上限">
              <el-input-number v-model="form.max_participants" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动积分">
              <el-input-number v-model="form.credit_points" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="活动详情" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { activityApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const searchForm = reactive({ keyword: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive({
  club_id: null,
  title: '',
  type: 'other',
  location: '',
  start_time: '',
  end_time: '',
  max_participants: 0,
  credit_points: 0,
  description: ''
})

const rules = {
  club_id: [{ required: true, message: '请选择社团', trigger: 'change' }],
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const typeText = { lecture: '讲座', volunteer: '志愿', competition: '比赛', party: '聚会', sports: '体育', other: '其他' }
const statusText = { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已拒绝', ongoing: '进行中', completed: '已完成', cancelled: '已取消' }
const statusType = { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger', ongoing: 'primary', completed: 'success', cancelled: 'info' }

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const myClubs = computed(() => {
  if (userStore.isAdmin()) return []
  return userStore.userInfo?.clubs || []
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await activityApi.getList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  Object.assign(form, {
    club_id: myClubs.value[0]?.clubId || null,
    title: '',
    type: 'other',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: 0,
    credit_points: 0,
    description: ''
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  router.push(`/activities/${row.id}`)
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await activityApi.create({
      ...form,
      start_time: dayjs(form.start_time).format('YYYY-MM-DD HH:mm:ss'),
      end_time: dayjs(form.end_time).format('YYYY-MM-DD HH:mm:ss')
    })
    ElMessage.success('活动发布成功，请提交审批')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>

<template>
  <div class="approval-list">
    <el-card>
      <template #header>
        <span>审批管理</span>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-select v-model="searchForm.type" placeholder="审批类型" clearable>
            <el-option label="活动审批" value="activity" />
            <el-option label="经费审批" value="fund" />
            <el-option label="物资审批" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeColor[row.type]">{{ typeText[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="club_name" label="社团" width="150" />
        <el-table-column prop="applicant_name" label="申请人" width="120" />
        <el-table-column prop="apply_reason" label="申请说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applied_at" label="申请时间" width="180">
          <template #default="{ row }">{{ formatDate(row.applied_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending' && canApprove">
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
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

    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { approvalApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const tableData = ref([])
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const currentApproval = ref(null)

const searchForm = reactive({ type: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const typeText = { activity: '活动', fund: '经费', equipment: '物资', member_join: '入团' }
const typeColor = { activity: 'primary', fund: 'warning', equipment: 'success', member_join: 'info' }
const statusText = { pending: '待审批', approved: '已通过', rejected: '已拒绝', cancelled: '已取消' }
const statusType = { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info' }

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
const canApprove = computed(() => userStore.canApprove())

const loadData = async () => {
  loading.value = true
  try {
    const res = await approvalApi.getList({
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

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确定要通过该申请吗？', '提示')
    await approvalApi.approve(row.id)
    ElMessage.success('审批通过')
    loadData()
  } catch (error) {
    console.error(error)
  }
}

const handleReject = (row) => {
  currentApproval.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await approvalApi.reject(currentApproval.value.id, { reject_reason: rejectReason.value })
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error(error)
  }
}

const handleView = (row) => {
  ElMessage.info('查看详情功能开发中')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>

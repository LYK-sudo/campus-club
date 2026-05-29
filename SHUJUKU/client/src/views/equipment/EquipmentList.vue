<template>
  <div class="equipment-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物资管理</span>
          <el-button type="primary" @click="handleAdd">新增物资</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="物资名称" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="物资名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="total_count" label="总数量" width="80" />
        <el-table-column prop="available_count" label="可借数量" width="100">
          <template #default="{ row }">
            <el-tag :type="row.available_count > 0 ? 'success' : 'danger'">
              {{ row.available_count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="condition_status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="conditionType[row.condition_status]">{{ conditionText[row.condition_status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_club_name" label="归属" width="150">
          <template #default="{ row }">{{ row.owner_club_name || '学校公共' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleBorrow(row)" :disabled="row.available_count <= 0">借用</el-button>
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

    <el-dialog v-model="dialogVisible" title="新增物资" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="音响设备" value="音响设备" />
            <el-option label="投影设备" value="投影设备" />
            <el-option label="运动器材" value="运动器材" />
            <el-option label="文具耗材" value="文具耗材" />
            <el-option label="服装道具" value="服装道具" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.total_count" :min="1" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="borrowDialogVisible" title="借用物资" width="500px">
      <el-form ref="borrowFormRef" :model="borrowForm" :rules="borrowRules" label-width="80px">
        <el-form-item label="借用社团" prop="club_id">
          <el-select v-model="borrowForm.club_id" style="width: 100%">
            <el-option v-for="club in myClubs" :key="club.clubId" :label="club.clubName" :value="club.clubId" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="borrowForm.quantity" :min="1" :max="currentEquipment?.available_count || 1" />
        </el-form-item>
        <el-form-item label="借用日期" prop="borrow_date">
          <el-date-picker v-model="borrowForm.borrow_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="归还日期" prop="return_date">
          <el-date-picker v-model="borrowForm.return_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="borrowForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBorrowSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { equipmentApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const borrowDialogVisible = ref(false)
const formRef = ref(null)
const borrowFormRef = ref(null)
const currentEquipment = ref(null)

const searchForm = reactive({ keyword: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const form = reactive({ name: '', category: '其他', total_count: 1, description: '' })
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

const borrowForm = reactive({ club_id: null, quantity: 1, borrow_date: '', return_date: '', reason: '' })
const borrowRules = {
  club_id: [{ required: true, message: '请选择社团', trigger: 'change' }],
  borrow_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  return_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const conditionText = { good: '良好', damaged: '损坏', lost: '丢失' }
const conditionType = { good: 'success', damaged: 'warning', lost: 'danger' }

const myClubs = computed(() => userStore.userInfo?.clubs || [])

const loadData = async () => {
  loading.value = true
  try {
    const res = await equipmentApi.getList({
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
  Object.assign(form, { name: '', category: '其他', total_count: 1, description: '' })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await equipmentApi.create(form)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error(error)
  }
}

const handleBorrow = (row) => {
  currentEquipment.value = row
  Object.assign(borrowForm, {
    club_id: myClubs.value[0]?.clubId,
    quantity: 1,
    borrow_date: '',
    return_date: '',
    reason: ''
  })
  borrowDialogVisible.value = true
}

const handleBorrowSubmit = async () => {
  const valid = await borrowFormRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await equipmentApi.borrow({
      equipment_id: currentEquipment.value.id,
      ...borrowForm,
      borrow_date: dayjs(borrowForm.borrow_date).format('YYYY-MM-DD'),
      return_date: dayjs(borrowForm.return_date).format('YYYY-MM-DD')
    })
    ElMessage.success('借用申请已提交')
    borrowDialogVisible.value = false
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

<template>
  <div class="club-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>社团列表</span>
          <el-button type="primary" v-if="userStore.isAdmin()" @click="handleAdd">
            新建社团
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="社团名称" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.category" placeholder="分类" clearable>
            <el-option label="文艺" value="文艺" />
            <el-option label="体育" value="体育" />
            <el-option label="学术" value="学术" />
            <el-option label="公益" value="公益" />
            <el-option label="科技" value="科技" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="社团名称" min-width="150">
          <template #default="{ row }">
            <div class="club-name">
              <el-avatar :size="40" :src="row.logo_url">{{ row.name.charAt(0) }}</el-avatar>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="total_members" label="成员数" width="80" />
        <el-table-column prop="budget" label="经费余额" width="120">
          <template #default="{ row }">¥{{ row.budget?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="成立时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" v-if="canEdit(row)" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="社团名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="文艺" value="文艺" />
            <el-option label="体育" value="体育" />
            <el-option label="学术" value="学术" />
            <el-option label="公益" value="公益" />
            <el-option label="科技" value="科技" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="最大人数" prop="max_members">
          <el-input-number v-model="form.max_members" :min="1" :max="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { clubApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新建社团')
const formRef = ref(null)

const searchForm = reactive({
  keyword: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  category: '其他',
  description: '',
  max_members: 100
})

const rules = {
  name: [{ required: true, message: '请输入社团名称', trigger: 'blur' }]
}

const statusText = { active: '正常', suspended: '暂停', disbanded: '解散' }
const statusType = { active: 'success', suspended: 'warning', disbanded: 'danger' }

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const canEdit = (row) => userStore.isAdmin() || userStore.isClubPresident(row.id)

const loadData = async () => {
  loading.value = true
  try {
    const res = await clubApi.getList({
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
  dialogTitle.value = '新建社团'
  Object.assign(form, { id: null, name: '', category: '其他', description: '', max_members: 100 })
  dialogVisible.value = true
}

const handleView = (row) => {
  router.push(`/clubs/${row.id}`)
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑社团'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    if (form.id) {
      await clubApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await clubApi.create(form)
      ElMessage.success('创建成功')
    }
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

.club-name {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>

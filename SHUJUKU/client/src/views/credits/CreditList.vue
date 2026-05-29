<template>
  <div class="credit-list">
    <el-card>
      <template #header>
        <span>积分记录</span>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="club_name" label="社团" width="150" />
        <el-table-column prop="activity_title" label="活动" min-width="200" />
        <el-table-column prop="points_change" label="积分变动" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.points_change > 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.points_change > 0 ? '+' : '' }}{{ row.points_change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" width="200" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { creditApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')

const loadData = async () => {
  loading.value = true
  try {
    const res = await creditApi.getList({
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

onMounted(() => {
  loadData()
})
</script>

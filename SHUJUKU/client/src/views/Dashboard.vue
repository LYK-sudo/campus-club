<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: item.color }">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats[item.key] || 0 }}</div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>数据概览</span>
          </template>
          <div ref="chartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.start_time"
              placement="top"
            >
              <el-card shadow="never">
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.club_name }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const chartRef = ref(null)
const stats = ref({})
const recentActivities = ref([])

const isAdmin = computed(() => userStore.isAdmin() || userStore.isTeacher())

const statCards = computed(() => {
  if (isAdmin.value) {
    return [
      { key: 'totalUsers', label: '用户总数', icon: 'User', color: '#409eff' },
      { key: 'totalClubs', label: '社团总数', icon: 'OfficeBuilding', color: '#67c23a' },
      { key: 'totalActivities', label: '活动总数', icon: 'Calendar', color: '#e6a23c' },
      { key: 'pendingApprovals', label: '待审批', icon: 'Document', color: '#f56c6c' }
    ]
  } else {
    return [
      { key: 'myClubs', label: '我的社团', icon: 'OfficeBuilding', color: '#409eff' },
      { key: 'myActivities', label: '参与活动', icon: 'Calendar', color: '#67c23a' },
      { key: 'totalPoints', label: '总积分', icon: 'Star', color: '#e6a23c' },
      { key: 'myRegistrations', label: '待参加', icon: 'Clock', color: '#f56c6c' }
    ]
  }
})

const loadStats = async () => {
  try {
    const res = await dashboardApi.getStats()
    stats.value = res.data
    recentActivities.value = res.data.recentActivities || []
    
    if (isAdmin.value && chartRef.value) {
      initChart(res.data)
    }
  } catch (error) {
    console.error(error)
  }
}

const initChart = (data) => {
  const chart = echarts.init(chartRef.value)
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        name: '社团分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: (data.clubsByCategory || []).map(item => ({
          name: item.category,
          value: item.count
        }))
      }
    ]
  }
  
  chart.setOption(option)
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}
</style>

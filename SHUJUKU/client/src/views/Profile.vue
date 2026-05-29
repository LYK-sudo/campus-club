<template>
  <div class="profile">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div class="user-profile">
            <el-avatar :size="100" :src="userStore.userInfo?.avatar_url">
              {{ userStore.userInfo?.name?.charAt(0) }}
            </el-avatar>
            <h2>{{ userStore.userInfo?.name }}</h2>
            <p>{{ roleText[userStore.userInfo?.role] }}</p>
            <p>{{ userStore.userInfo?.department }}</p>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="学号">
              <el-input v-model="form.student_no" disabled />
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
            <el-form-item label="手机">
              <el-input v-model="form.phone" />
            </el-form-item>
            <el-form-item label="院系">
              <el-input v-model="form.department" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdate">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>我的社团</span>
          </template>
          <el-empty v-if="!userStore.userInfo?.clubs?.length" description="暂未加入任何社团" />
          <div v-else class="club-list">
            <div v-for="club in userStore.userInfo?.clubs" :key="club.clubId" class="club-item">
              <div class="club-name">{{ club.clubName }}</div>
              <el-tag size="small" :type="club.role === 'president' ? 'danger' : ''">
                {{ roleText[club.role] }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref(null)

const form = reactive({
  student_no: '',
  name: '',
  email: '',
  phone: '',
  department: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const roleText = { super_admin: '超级管理员', teacher: '校团委老师', user: '普通用户', president: '负责人', vice_president: '副会长', member: '成员' }

const initForm = () => {
  const user = userStore.userInfo
  if (user) {
    form.student_no = user.student_no
    form.name = user.name
    form.email = user.email || ''
    form.phone = user.phone || ''
    form.department = user.department || ''
  }
}

const handleUpdate = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  try {
    await userStore.updateProfile(form)
    ElMessage.success('修改成功')
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  initForm()
})
</script>

<style scoped>
.user-profile {
  text-align: center;
  padding: 20px 0;
}

.user-profile h2 {
  margin: 15px 0 10px;
}

.user-profile p {
  color: #999;
  margin: 5px 0;
}

.club-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.club-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.club-name {
  font-weight: bold;
}
</style>

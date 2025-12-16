<template>
  <el-card class="skeleton-card">
    <el-skeleton :rows="3" animated>
      <template #template>
        <div class="skeleton-content">
          <el-skeleton-item variant="rect" class="skeleton-image" />
          <div class="skeleton-text">
            <el-skeleton-item variant="h3" class="skeleton-title" />
            <el-skeleton-item variant="text" class="skeleton-line" />
            <el-skeleton-item variant="text" class="skeleton-line short" />
          </div>
        </div>
      </template>
    </el-skeleton>
  </el-card>
</template>

<script setup>
</script>

<style scoped>
.skeleton-card {
  margin-bottom: var(--spacing-6);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.skeleton-content {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

.skeleton-image {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-base);
  flex-shrink: 0;
}

.skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-title {
  width: 60%;
  height: 24px;
}

.skeleton-line {
  width: 100%;
  height: 16px;
}

.skeleton-line.short {
  width: 80%;
}
</style>


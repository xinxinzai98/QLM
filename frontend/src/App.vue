<template>
  <router-view />
  <UserGuide />
</template>

<script setup>
import { onMounted } from 'vue';
import UserGuide from '@/components/UserGuide.vue';

// 应用主题
const applyTheme = () => {
  const themeMode = localStorage.getItem('themeMode') || 'light';
  document.documentElement.setAttribute('data-theme', themeMode);
};

onMounted(() => {
  // 应用主题
  applyTheme();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  min-height: 100vh;
  font-family: var(--font-family-base);
}

body {
  background-color: var(--color-neutral-50);
}
</style>


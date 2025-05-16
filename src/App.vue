<template>
  <NConfigProvider :theme="darkTheme">
    <NMessageProvider>
      <RouterView></RouterView>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui';
import { RouterView } from 'vue-router';
</script>

<style>
:root {
  --body-color: #18181c;
  --text-color: #ffffff;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--body-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  min-height: 100vh;
}
</style>

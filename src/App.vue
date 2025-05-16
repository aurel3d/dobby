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
  --neon-pink: 255, 16, 240;
  --neon-blue: 0, 234, 255;
  --neon-purple: 191, 64, 255;
  --neon-yellow: 255, 215, 0;
  --cyber-bg: 13, 17, 23;
  --cyber-bg-2: 22, 27, 34;
}

html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(var(--cyber-bg), 0.95) 0%,
    rgba(var(--cyber-bg-2), 0.95) 100%
  );
  color: #ffffff;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* Animated background effect */
html::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: 
    radial-gradient(circle at 20% 20%, rgba(var(--neon-pink), 0.15) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(var(--neon-blue), 0.15) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(var(--neon-purple), 0.1) 0%, transparent 60%);
  z-index: -1;
  animation: backgroundPulse 10s ease-in-out infinite alternate;
}

@keyframes backgroundPulse {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
}

#app {
  min-height: 100vh;
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(var(--neon-blue), 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--neon-pink), 0.3);
  border-radius: 10px;
  border: 1px solid rgba(var(--neon-blue), 0.2);
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--neon-pink), 0.5);
}

/* Global card styles */
.n-card {
  background: rgba(22, 27, 34, 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(var(--neon-blue), 0.2) !important;
  border-radius: 24px !important;
}

/* Global button styles */
.n-button {
  background: rgba(var(--neon-blue), 0.2) !important;
  border: 1px solid rgba(var(--neon-blue), 0.3) !important;
  box-shadow: 0 0 10px rgba(var(--neon-blue), 0.1) !important;
  border-radius: 12px !important;
  color: rgba(255, 255, 255, 0.9) !important;
  text-shadow: 0 0 8px rgba(var(--neon-blue), 0.5) !important;
  font-weight: 500 !important;
}

.n-button:hover {
  background: rgba(var(--neon-blue), 0.3) !important;
  border: 1px solid rgba(var(--neon-blue), 0.5) !important;
  box-shadow: 0 0 15px rgba(var(--neon-blue), 0.2) !important;
  color: #ffffff !important;
  text-shadow: 0 0 12px rgba(var(--neon-blue), 0.7) !important;
}

.n-button:disabled {
  opacity: 0.5 !important;
  color: rgba(255, 255, 255, 0.6) !important;
  text-shadow: none !important;
}
</style>

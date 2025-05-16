<template>
  <div class="dashboard">
    <n-layout>
      <n-layout-header class="glass-header">
        <n-page-header>
          <template #title>
            <span class="dashboard-title">Smart Home Dashboard</span>
          </template>
          <template #extra>
            <n-space>
              <n-tag :type="mqttConnected ? 'success' : 'error'" class="glass-tag">
                {{ mqttConnected ? 'Connected' : 'Disconnected' }}
              </n-tag>
              <n-tag class="glass-tag">
                {{ deviceCount }} Devices
              </n-tag>
              <n-button 
                type="warning" 
                @click="turnOffAllLights"
                :disabled="!mqttConnected"
                class="glass-button"
              >
                Turn Off All Lights
              </n-button>
            </n-space>
          </template>
        </n-page-header>
      </n-layout-header>

      <n-layout-content class="content glass-content">
        <template v-if="deviceCount > 0">
          <div v-for="[type, devices] in deviceGroups" :key="type" class="device-group">
            <h2 class="group-title">{{ type }} ({{ devices.length }})</h2>
            <div class="devices-grid">
              <device-card
                v-for="device in devices"
                :key="device.ieee_address"
                :device="device"
              />
            </div>
          </div>
        </template>
        <template v-else>
          <n-empty description="No devices found" class="glass-empty">
            <template #extra>
              <n-button @click="refreshDevices" class="glass-button">
                Refresh Devices
              </n-button>
            </template>
          </n-empty>
        </template>

        <AutomationManager />
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import {
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NPageHeader,
  NSpace,
  NTag,
  NEmpty,
  NButton
} from 'naive-ui';
import DeviceCard from '@/components/DeviceCard.vue';
import { useDeviceStore } from '@/stores/devices';
import mqttService, { isConnected } from '@/services/mqtt';
import AutomationManager from '@/components/AutomationManager.vue';

const store = useDeviceStore();
const deviceGroups = computed(() => store.devicesByType);
const deviceCount = computed(() => store.devicesList.length);
const mqttConnected = isConnected;

const refreshDevices = () => {
  console.log('Refreshing devices...');
  mqttService.refreshDevices();
};

const turnOffAllLights = () => {
  console.log('Turning off all lights...');
  mqttService.turnOffAllLights();
};

onMounted(() => {
  console.log('Dashboard mounted');
  mqttService.connect();
});
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.glass-header {
  background: rgba(var(--cyber-bg-2), 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border-bottom: 1px solid rgba(var(--neon-blue), 0.3) !important;
  box-shadow: 0 4px 20px rgba(var(--neon-blue), 0.1) !important;
  padding: 0.5rem 0;
}

.dashboard-title {
  color: rgba(var(--neon-pink), 1);
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(var(--neon-pink), 0.5);
  letter-spacing: 1px;
}

.content {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.glass-content {
  background: transparent !important;
}

.device-group {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(var(--cyber-bg-2), 0.7);
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(var(--neon-blue), 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--neon-blue), 0.2);
  position: relative;
  overflow: hidden;
}

.device-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--neon-blue), 0.5),
    transparent
  );
}

.group-title {
  margin-bottom: 1.5rem;
  color: rgba(var(--neon-yellow), 1);
  font-size: 1.25rem;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(var(--neon-yellow), 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-title::before {
  content: '//';
  color: rgba(var(--neon-blue), 0.7);
  font-weight: bold;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.glass-tag {
  background: rgba(var(--cyber-bg-2), 0.7) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(var(--neon-purple), 0.3) !important;
  box-shadow: 0 0 10px rgba(var(--neon-purple), 0.1) !important;
  border-radius: 12px !important;
  color: rgba(255, 255, 255, 0.9) !important;
  text-shadow: 0 0 8px rgba(var(--neon-purple), 0.5) !important;
  font-weight: 500 !important;
}

.glass-tag.n-tag--success {
  border-color: rgba(var(--neon-blue), 0.5) !important;
  box-shadow: 0 0 10px rgba(var(--neon-blue), 0.2) !important;
  color: #ffffff !important;
  text-shadow: 0 0 8px rgba(var(--neon-blue), 0.5) !important;
}

.glass-tag.n-tag--error {
  border-color: rgba(var(--neon-pink), 0.5) !important;
  box-shadow: 0 0 10px rgba(var(--neon-pink), 0.2) !important;
  color: #ffffff !important;
  text-shadow: 0 0 8px rgba(var(--neon-pink), 0.5) !important;
}

.glass-button {
  background: rgba(var(--neon-purple), 0.2) !important;
  border: 1px solid rgba(var(--neon-purple), 0.3) !important;
  box-shadow: 0 0 10px rgba(var(--neon-purple), 0.1) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  text-shadow: 0 0 8px rgba(var(--neon-purple), 0.5) !important;
  font-weight: 500 !important;
}

.glass-button:hover:not(:disabled) {
  background: rgba(var(--neon-purple), 0.3) !important;
  border-color: rgba(var(--neon-purple), 0.5) !important;
  box-shadow: 0 0 15px rgba(var(--neon-purple), 0.2) !important;
  transform: translateY(-1px);
  color: #ffffff !important;
  text-shadow: 0 0 12px rgba(var(--neon-purple), 0.7) !important;
}

.glass-empty {
  background: rgba(var(--cyber-bg-2), 0.7);
  padding: 2rem;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(var(--neon-blue), 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(var(--neon-blue), 0.2);
}

:deep(.n-tag) {
  background: rgba(var(--cyber-bg-2), 0.7) !important;
}

:deep(.n-button) {
  background: rgba(var(--neon-purple), 0.2) !important;
}

:deep(.n-button:not(:disabled):hover) {
  background: rgba(var(--neon-purple), 0.3) !important;
}
</style> 
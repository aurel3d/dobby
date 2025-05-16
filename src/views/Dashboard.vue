<template>
  <div class="dashboard">
    <n-layout>
      <n-layout-header>
        <n-page-header>
          <template #title>
            Smart Home Dashboard
          </template>
          <template #extra>
            <n-space>
              <n-tag :type="mqttConnected ? 'success' : 'error'">
                {{ mqttConnected ? 'Connected' : 'Disconnected' }}
              </n-tag>
              <n-tag>
                {{ deviceCount }} Devices
              </n-tag>
            </n-space>
          </template>
        </n-page-header>
      </n-layout-header>

      <n-layout-content class="content">
        <template v-if="deviceCount > 0">
          <div v-for="[type, devices] in deviceGroups" :key="type" class="device-group">
            <h2>{{ type }} ({{ devices.length }})</h2>
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
          <n-empty description="No devices found">
            <template #extra>
              <n-button @click="refreshDevices">
                Refresh Devices
              </n-button>
            </template>
          </n-empty>
        </template>
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

const store = useDeviceStore();
const deviceGroups = computed(() => store.devicesByType);
const deviceCount = computed(() => store.devicesList.length);
const mqttConnected = isConnected;

const refreshDevices = () => {
  console.log('Refreshing devices...');
  mqttService.refreshDevices();
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

.content {
  padding: 24px;
}

.device-group {
  margin-bottom: 2rem;
}

.device-group h2 {
  margin-bottom: 1rem;
  color: var(--text-color-1);
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
</style> 
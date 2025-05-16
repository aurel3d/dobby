<template>
  <n-card :title="device.friendly_name" class="device-card glass-card">
    <template #header-extra>
      <n-tag :type="device.state?.available ? 'success' : 'error'" class="glass-tag">
        {{ device.state?.available ? 'Online' : 'Offline' }}
      </n-tag>
    </template>

    <div class="device-info">
      <p><strong>Model:</strong> {{ device.definition?.model }}</p>
      <p><strong>Vendor:</strong> {{ device.definition?.vendor }}</p>
    </div>

    <div class="device-controls">
      <template v-if="hasOnOff">
        <div class="cyber-button" :class="{ 'is-on': device.state?.state === 'ON' }" @click="togglePower(device.state?.state !== 'ON')">
          {{ device.state?.state === 'ON' ? 'ON' : 'OFF' }}
        </div>
      </template>

      <template v-if="hasBrightness">
        <n-slider
          v-model:value="brightness"
          :min="0"
          :max="255"
          :step="1"
          @update:value="updateBrightness"
          class="glass-slider"
        />
      </template>

      <template v-if="hasColorTemp">
        <n-slider
          v-model:value="colorTemp"
          :min="153"
          :max="500"
          :step="1"
          @update:value="updateColorTemp"
          class="glass-slider"
        />
      </template>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NTag, NSwitch, NSlider, NCollapse, NCollapseItem } from 'naive-ui';
import type { Device } from '@/services/mqtt';
import mqttService from '@/services/mqtt';

const props = defineProps<{
  device: Device;
}>();

const hasOnOff = computed(() => {
  return props.device.definition?.description?.includes('switch') ||
         props.device.definition?.description?.includes('light');
});

const hasBrightness = computed(() => {
  return props.device.definition?.description?.includes('light');
});

const hasColorTemp = computed(() => {
  return props.device.state?.color_temp !== undefined;
});

const brightness = ref(props.device.state?.brightness || 0);
const colorTemp = ref(props.device.state?.color_temp || 153);

watch(() => props.device.state, (newState) => {
  if (newState?.brightness !== undefined) {
    brightness.value = newState.brightness;
  }
  if (newState?.color_temp !== undefined) {
    colorTemp.value = newState.color_temp;
  }
}, { deep: true });

const togglePower = (value: boolean) => {
  mqttService.sendCommand(props.device.friendly_name, {
    state: value ? 'ON' : 'OFF'
  });
};

const updateBrightness = (value: number) => {
  mqttService.sendCommand(props.device.friendly_name, {
    brightness: value
  });
};

const updateColorTemp = (value: number) => {
  mqttService.sendCommand(props.device.friendly_name, {
    color_temp: value
  });
};
</script>

<style scoped>
.device-card {
  margin-bottom: 1rem;
  max-width: 400px;
  background: rgba(var(--cyber-bg-2), 0.7) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(var(--neon-blue), 0.2) !important;
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(var(--neon-blue), 0.1) !important;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.device-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    rgba(var(--neon-blue), 0.3),
    rgba(var(--neon-pink), 0.3),
    rgba(var(--neon-purple), 0.3)
  );
  border-radius: 24px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(var(--neon-blue), 0.2) !important;
}

.device-card:hover::before {
  opacity: 1;
}

.device-info {
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem;
  background: rgba(var(--cyber-bg), 0.3);
  border-radius: 16px;
  border: 1px solid rgba(var(--neon-purple), 0.2);
}

.device-info p {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.device-info p strong {
  color: rgba(var(--neon-yellow), 0.9);
  text-shadow: 0 0 5px rgba(var(--neon-yellow), 0.3);
}

.device-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(var(--cyber-bg), 0.3);
  border-radius: 18px;
  border: 1px solid rgba(var(--neon-blue), 0.2);
  position: relative;
}

.device-controls::before {
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

.glass-tag {
  background: rgba(var(--cyber-bg-2), 0.7) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(var(--neon-purple), 0.3) !important;
  box-shadow: 0 0 10px rgba(var(--neon-purple), 0.1) !important;
}

.cyber-button {
  width: 120px;
  height: 40px;
  position: relative;
  background: rgba(var(--cyber-bg), 0.9);
  border: 2px solid rgba(var(--neon-blue), 0.3);
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 8px rgba(var(--neon-blue), 0.5);
}

.cyber-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--neon-blue), 0.1),
    transparent
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.cyber-button:hover::before {
  transform: translateX(100%);
}

.cyber-button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--neon-blue), 0.5),
    transparent
  );
  transform: translateX(-100%);
  transition: transform 0.4s ease;
}

.cyber-button:hover::after {
  transform: translateX(0);
}

.cyber-button.is-on {
  background: rgba(var(--neon-blue), 0.2);
  border-color: rgba(var(--neon-blue), 0.8);
  color: #ffffff;
  text-shadow: 
    0 0 10px rgba(var(--neon-blue), 0.7),
    0 0 20px rgba(var(--neon-blue), 0.5);
  box-shadow: 
    0 0 15px rgba(var(--neon-blue), 0.3),
    inset 0 0 10px rgba(var(--neon-blue), 0.2);
}

.cyber-button.is-on::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--neon-blue), 0.2),
    transparent
  );
}

.cyber-button.is-on::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--neon-blue), 0.8),
    transparent
  );
  transform: translateX(0);
}

.glass-slider {
  background: rgba(var(--neon-blue), 0.1) !important;
}

:deep(.n-card-header) {
  border-bottom: 1px solid rgba(var(--neon-blue), 0.2) !important;
  background: rgba(var(--cyber-bg), 0.3) !important;
}

:deep(.n-card-header__main) {
  color: rgba(var(--neon-pink), 1) !important;
  text-shadow: 0 0 10px rgba(var(--neon-pink), 0.3);
  font-weight: 600;
}

:deep(.n-switch) {
  display: none !important;
}

:deep(.n-slider-rail) {
  background-color: rgba(var(--neon-purple), 0.2) !important;
  box-shadow: inset 0 0 5px rgba(var(--neon-purple), 0.1) !important;
}

:deep(.n-slider-rail__fill) {
  background-color: rgba(var(--neon-blue), 0.8) !important;
  box-shadow: 0 0 10px rgba(var(--neon-blue), 0.3) !important;
}

:deep(.n-slider-handle) {
  background-color: rgba(var(--neon-pink), 1) !important;
  box-shadow: 0 0 15px rgba(var(--neon-pink), 0.3) !important;
  border: 2px solid rgba(var(--neon-blue), 0.8) !important;
}

:deep(.n-slider-handle:hover) {
  box-shadow: 0 0 20px rgba(var(--neon-pink), 0.5) !important;
}

.properties-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(var(--cyber-bg), 0.2);
  border-radius: 12px;
  border: 1px solid rgba(var(--neon-blue), 0.1);
}

.property-name {
  color: rgba(var(--neon-yellow), 0.9);
  font-weight: 500;
}

.property-value {
  color: rgba(255, 255, 255, 0.9);
  font-family: monospace;
  padding: 0.2rem 0.4rem;
  background: rgba(var(--cyber-bg), 0.3);
  border-radius: 10px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.n-collapse) {
  margin-top: 1rem;
  background: transparent !important;
  border: 1px solid rgba(var(--neon-blue), 0.2) !important;
  border-radius: 16px;
}

:deep(.n-collapse-item__header) {
  background: rgba(var(--cyber-bg), 0.3) !important;
  color: rgba(var(--neon-blue), 0.9) !important;
}

:deep(.n-collapse-item__content-inner) {
  background: rgba(var(--cyber-bg), 0.1) !important;
}
</style> 
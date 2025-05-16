<template>
  <n-card :title="device.friendly_name" class="device-card">
    <template #header-extra>
      <n-tag :type="device.state?.available ? 'success' : 'error'">
        {{ device.state?.available ? 'Online' : 'Offline' }}
      </n-tag>
    </template>

    <div class="device-info">
      <p><strong>Model:</strong> {{ device.definition?.model }}</p>
      <p><strong>Vendor:</strong> {{ device.definition?.vendor }}</p>
    </div>

    <div class="device-controls">
      <template v-if="hasOnOff">
        <n-switch
          :value="device.state?.state === 'ON'"
          @update:value="togglePower"
        />
      </template>

      <template v-if="hasBrightness">
        <n-slider
          v-model:value="brightness"
          :min="0"
          :max="255"
          :step="1"
          @update:value="updateBrightness"
        />
      </template>

      <template v-if="hasColorTemp">
        <n-slider
          v-model:value="colorTemp"
          :min="153"
          :max="500"
          :step="1"
          @update:value="updateColorTemp"
        />
      </template>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NCard, NTag, NSwitch, NSlider } from 'naive-ui';
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
}

.device-info {
  margin-bottom: 1rem;
}

.device-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style> 
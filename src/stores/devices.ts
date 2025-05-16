import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Device } from '@/services/mqtt';
import { devices } from '@/services/mqtt';

export const useDeviceStore = defineStore('devices', () => {
  const devicesList = computed(() => Array.from(devices.value.values()));

  const devicesByType = computed(() => {
    console.log('Computing devices by type. Total devices:', devicesList.value.length);
    const grouped = new Map<string, Device[]>();
    
    devicesList.value.forEach((device) => {
      const type = device.definition?.description || 'Unknown';
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      const group = grouped.get(type);
      if (group) {
        group.push(device);
      }
    });
    
    console.log('Grouped devices:', Object.fromEntries(grouped));
    return grouped;
  });

  const getDeviceByName = (name: string) => devices.value.get(name);

  return {
    devicesList,
    devicesByType,
    getDeviceByName,
  };
}); 
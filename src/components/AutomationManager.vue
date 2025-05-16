<template>
  <div class="automation-manager">
    <n-card title="Automations" class="glass-card">
      <template #header-extra>
        <n-button @click="showCreateModal = true" type="primary" class="cyber-button">
          Create Automation
        </n-button>
      </template>

      <n-list v-if="automationStore.automations.length > 0">
        <n-list-item v-for="automation in automationStore.automations" :key="automation.id">
          <n-space justify="space-between" align="center" style="width: 100%">
            <div>
              <h3>{{ automation.name }}</h3>
              <p class="automation-summary">
                {{ summarizeAutomation(automation) }}
              </p>
            </div>
            <n-space>
              <n-switch 
                v-model:value="automation.enabled"
                @update:value="(value) => updateAutomationState(automation, value)"
              />
              <n-button @click="editAutomation(automation)" type="info" class="cyber-button">
                Edit
              </n-button>
              <n-button @click="removeAutomation(automation.id)" type="error" class="cyber-button">
                Delete
              </n-button>
            </n-space>
          </n-space>
        </n-list-item>
      </n-list>
      <n-empty v-else description="No automations created yet" />
    </n-card>

    <n-modal v-model:show="showCreateModal" style="width: 600px" preset="card" title="Create Automation">
      <n-form ref="formRef" :model="automationForm" :rules="rules">
        <n-form-item label="Name" path="name">
          <n-input v-model:value="automationForm.name" placeholder="Enter automation name" />
        </n-form-item>

        <n-divider>Triggers</n-divider>
        <div v-for="(trigger, index) in automationForm.triggers" :key="index" class="trigger-item">
          <n-space vertical>
            <n-select v-model:value="trigger.type" :options="triggerTypes" placeholder="Select trigger type" />
            
            <template v-if="trigger.type === 'device'">
              <n-select
                v-model:value="trigger.deviceId"
                :options="deviceOptions"
                placeholder="Select device"
              />
              <n-select
                v-model:value="trigger.property"
                :options="trigger.deviceId ? getDeviceProperties(trigger.deviceId) : []"
                placeholder="Select property to watch"
              />
              <template v-if="trigger.deviceId && trigger.property">
                <n-select
                  v-if="getPropertyValueOptions(trigger.deviceId, trigger.property).length > 0"
                  v-model:value="trigger.value"
                  :options="getPropertyValueOptions(trigger.deviceId, trigger.property)"
                  placeholder="Select value"
                />
                <n-input-number
                  v-else-if="getPropertyValueType(trigger.deviceId, trigger.property) === 'number'"
                  v-model:value="trigger.value"
                  placeholder="Enter numeric value"
                />
                <n-input
                  v-else
                  v-model:value="trigger.value"
                  placeholder="Enter value"
                />
              </template>
            </template>

            <template v-if="trigger.type === 'time'">
              <n-time-picker v-model:value="trigger.time" format="HH:mm" placeholder="Select time" />
              <n-select
                v-model:value="trigger.days"
                multiple
                :options="dayOptions"
                placeholder="Select days"
              />
            </template>
          </n-space>
          <n-button @click="removeTrigger(index)" type="error" class="cyber-button">
            Remove Trigger
          </n-button>
        </div>
        <n-button @click="addTrigger" type="primary" class="cyber-button">
          Add Trigger
        </n-button>

        <n-divider>Conditions</n-divider>
        <div v-for="(condition, index) in automationForm.conditions" :key="index" class="condition-item">
          <n-space vertical>
            <n-select v-model:value="condition.type" :options="conditionTypes" placeholder="Select condition type" />
            <n-select v-model:value="condition.operator" :options="operatorOptions" placeholder="Select operator" />

            <template v-if="condition.type === 'device'">
              <n-select
                v-model:value="condition.deviceId"
                :options="deviceOptions"
                placeholder="Select device"
              />
              <n-select
                v-model:value="condition.property"
                :options="condition.deviceId ? getDeviceProperties(condition.deviceId) : []"
                placeholder="Select property to check"
              />
              <template v-if="condition.deviceId && condition.property">
                <n-select
                  v-if="getPropertyValueOptions(condition.deviceId, condition.property).length > 0"
                  v-model:value="condition.value"
                  :options="getPropertyValueOptions(condition.deviceId, condition.property)"
                  placeholder="Select value"
                />
                <n-input-number
                  v-else-if="getPropertyValueType(condition.deviceId, condition.property) === 'number'"
                  v-model:value="condition.value"
                  placeholder="Enter numeric value"
                />
                <n-input
                  v-else
                  v-model:value="condition.value"
                  placeholder="Enter value"
                />
              </template>
            </template>

            <template v-if="condition.type === 'time'">
              <n-time-picker v-model:value="condition.time" format="HH:mm" placeholder="Select time" />
              <template v-if="condition.operator === 'between'">
                <n-time-picker v-model:value="condition.endTime" format="HH:mm" placeholder="Select end time" />
              </template>
              <n-select
                v-model:value="condition.days"
                multiple
                :options="dayOptions"
                placeholder="Select days"
              />
            </template>
          </n-space>
          <n-button @click="removeCondition(index)" type="error" class="cyber-button">
            Remove Condition
          </n-button>
        </div>
        <n-button @click="addCondition" type="primary" class="cyber-button">
          Add Condition
        </n-button>

        <n-divider>Actions</n-divider>
        <div v-for="(action, index) in automationForm.actions" :key="index" class="action-item">
          <n-space vertical>
            <n-select v-model:value="action.type" :options="actionTypes" placeholder="Select action type" />

            <template v-if="action.type === 'device'">
              <n-select
                v-model:value="action.deviceId"
                :options="deviceOptions"
                placeholder="Select device"
              />
              <n-select
                v-model:value="action.command"
                :options="action.deviceId ? getDeviceProperties(action.deviceId) : []"
                placeholder="Select property to change"
              />
              <template v-if="action.deviceId && action.command">
                <n-select
                  v-if="getPropertyValueOptions(action.deviceId, action.command).length > 0"
                  v-model:value="action.value"
                  :options="getPropertyValueOptions(action.deviceId, action.command)"
                  placeholder="Select value"
                />
                <n-input-number
                  v-else-if="getPropertyValueType(action.deviceId, action.command) === 'number'"
                  v-model:value="action.value"
                  placeholder="Enter numeric value"
                />
                <n-input
                  v-else
                  v-model:value="action.value"
                  placeholder="Enter value"
                />
              </template>
            </template>

            <template v-if="action.type === 'notification'">
              <n-input v-model:value="action.message" type="textarea" placeholder="Notification message" />
              <n-select v-model:value="action.level" :options="notificationLevels" placeholder="Select level" />
            </template>
          </n-space>
          <n-button @click="removeAction(index)" type="error" class="cyber-button">
            Remove Action
          </n-button>
        </div>
        <n-button @click="addAction" type="primary" class="cyber-button">
          Add Action
        </n-button>

        <n-space justify="end" style="margin-top: 24px">
          <n-button @click="showCreateModal = false" class="cyber-button">Cancel</n-button>
          <n-button type="primary" @click="saveAutomation" class="cyber-button">Save</n-button>
        </n-space>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NCard,
  NButton,
  NSpace,
  NList,
  NListItem,
  NEmpty,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NTimePicker,
  NDivider,
  NSwitch
} from 'naive-ui';
import { useAutomationStore } from '@/services/automation';
import type { Automation, Trigger, Condition, Action } from '@/types/automation';
import mqttService, { devices } from '@/services/mqtt';

const automationStore = useAutomationStore();
const showCreateModal = ref(false);
const formRef = ref();

const automationForm = ref({
  name: '',
  enabled: true,
  triggers: [] as Trigger[],
  conditions: [] as Condition[],
  actions: [] as Action[]
});

const rules = {
  name: {
    required: true,
    message: 'Please enter a name',
    trigger: 'blur'
  }
};

const triggerTypes = [
  { label: 'Device', value: 'device' },
  { label: 'Time', value: 'time' },
  { label: 'State', value: 'state' }
];

const conditionTypes = [
  { label: 'Device', value: 'device' },
  { label: 'Time', value: 'time' },
  { label: 'State', value: 'state' }
];

const actionTypes = [
  { label: 'Device', value: 'device' },
  { label: 'Scene', value: 'scene' },
  { label: 'Notification', value: 'notification' }
];

const operatorOptions = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'notEquals' },
  { label: 'Greater Than', value: 'greaterThan' },
  { label: 'Less Than', value: 'lessThan' },
  { label: 'Between', value: 'between' },
  { label: 'Contains', value: 'contains' }
];

const notificationLevels = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' }
];

const dayOptions = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' }
];

const deviceOptions = computed(() => {
  return Array.from(devices.value.entries()).map(([id, device]) => ({
    label: device.friendly_name,
    value: id
  }));
});

const getDeviceProperties = (deviceId: string) => {
  const device = devices.value.get(deviceId);
  if (!device?.state) return [];
  
  return Object.entries(device.state)
    .filter(([key]) => !['available', 'last_seen'].includes(key))
    .map(([key, value]) => ({
      label: key,
      value: key,
      example: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
};

const getPropertyValueType = (deviceId: string, property: string) => {
  const device = devices.value.get(deviceId);
  if (!device?.state || !(property in device.state)) return 'text';
  
  const value = device.state[property];
  switch (typeof value) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    default:
      return 'text';
  }
};

const getPropertyValueOptions = (deviceId: string, property: string) => {
  const device = devices.value.get(deviceId);
  if (!device?.state || !(property in device.state)) return [];
  
  const value = device.state[property];
  if (typeof value === 'boolean') {
    return [
      { label: 'ON', value: 'ON' },
      { label: 'OFF', value: 'OFF' }
    ];
  }
  
  if (property === 'brightness') {
    return [
      { label: 'Off (0)', value: 0 },
      { label: '25%', value: 64 },
      { label: '50%', value: 128 },
      { label: '75%', value: 192 },
      { label: 'Full (255)', value: 255 }
    ];
  }
  
  if (property === 'color_temp') {
    return [
      { label: 'Warm (153)', value: 153 },
      { label: 'Neutral (327)', value: 327 },
      { label: 'Cool (500)', value: 500 }
    ];
  }
  
  return [];
};

function addTrigger() {
  automationForm.value.triggers.push({
    type: 'device'
  });
}

function removeTrigger(index: number) {
  automationForm.value.triggers.splice(index, 1);
}

function addCondition() {
  automationForm.value.conditions.push({
    type: 'device',
    operator: 'equals'
  });
}

function removeCondition(index: number) {
  automationForm.value.conditions.splice(index, 1);
}

function addAction() {
  automationForm.value.actions.push({
    type: 'device'
  });
}

function removeAction(index: number) {
  automationForm.value.actions.splice(index, 1);
}

function updateAutomationState(automation: Automation, enabled: boolean) {
  automationStore.updateAutomation({ ...automation, enabled });
}

function saveAutomation() {
  if (editingAutomation.value) {
    automationStore.updateAutomation(automationForm.value);
  } else {
    automationStore.addAutomation(automationForm.value);
  }
  showCreateModal.value = false;
  resetForm();
}

const editingAutomation = ref<Automation | null>(null);

function editAutomation(automation: Automation) {
  editingAutomation.value = automation;
  automationForm.value = { ...automation };
  showCreateModal.value = true;
}

function removeAutomation(id: string) {
  automationStore.removeAutomation(id);
}

function resetForm() {
  editingAutomation.value = null;
  automationForm.value = {
    name: '',
    enabled: true,
    triggers: [],
    conditions: [],
    actions: []
  };
}

function summarizeAutomation(automation: Automation): string {
  const triggers = automation.triggers.map(t => {
    switch (t.type) {
      case 'device':
        return `When device ${t.deviceId} ${t.property} is ${t.value}`;
      case 'time':
        return `At ${t.time?.hour}:${t.time?.minute}${t.days ? ` on ${t.days.join(', ')}` : ''}`;
      default:
        return t.type;
    }
  }).join(' OR ');

  const conditions = automation.conditions.length
    ? ` IF ${automation.conditions.map(c => `${c.type} ${c.operator}`).join(' AND ')}`
    : '';

  const actions = automation.actions.map(a => {
    switch (a.type) {
      case 'device':
        return `set ${a.deviceId} ${a.command} to ${a.value}`;
      case 'notification':
        return `send ${a.level} notification`;
      default:
        return a.type;
    }
  }).join(' AND ');

  return `${triggers}${conditions} THEN ${actions}`;
}
</script>

<style scoped>
.automation-manager {
  padding: 1rem;
}

.trigger-item,
.condition-item,
.action-item {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid rgba(var(--neon-blue), 0.2);
  border-radius: 8px;
  background: rgba(var(--cyber-bg), 0.3);
}

.automation-summary {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

:deep(.n-card) {
  background: rgba(var(--cyber-bg-2), 0.7) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(var(--neon-blue), 0.2) !important;
}

:deep(.n-modal) {
  background: rgba(var(--cyber-bg-2), 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(var(--neon-blue), 0.2) !important;
}

:deep(.n-input) {
  background: rgba(var(--cyber-bg), 0.3) !important;
}

:deep(.n-select) {
  background: rgba(var(--cyber-bg), 0.3) !important;
}

:deep(.n-time-picker) {
  background: rgba(var(--cyber-bg), 0.3) !important;
}
</style> 
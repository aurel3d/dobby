import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import type { Automation, Trigger, Condition, Action, TimeOfDay, DayOfWeek } from '@/types/automation';
import mqttService, { devices } from '@/services/mqtt';
import type { Device } from '@/types/mqtt';

const STORAGE_KEY = 'dobby_automations';

// Add a Set to track recently executed automations
const recentlyExecuted = new Set<string>();

// Debounce helper function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const useAutomationStore = defineStore('automation', () => {
  const automations = ref<Automation[]>([]);
  const activeTimers = new Map<string, NodeJS.Timeout>();

  // Load saved automations
  function loadAutomations() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        automations.value = parsed;
        // Setup timers for all loaded automations
        automations.value.forEach(automation => {
          if (automation.enabled) {
            setupTimeTriggers(automation);
          }
        });
      }
    } catch (error) {
      console.error('Error loading automations:', error);
    }
  }

  // Save automations to localStorage
  function saveAutomations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(automations.value));
    } catch (error) {
      console.error('Error saving automations:', error);
    }
  }

  // Watch for changes in automations and save them
  watch(() => automations.value, () => {
    saveAutomations();
  }, { deep: true });

  // Initialize by loading saved automations
  loadAutomations();

  // Watch for device state changes
  watch(() => devices.value, (devices) => {
    checkDeviceTriggers(devices);
  }, { deep: true });

  // Modify the checkDeviceTriggers function
  const checkDeviceTriggers = debounce((devices: Map<string, Device>) => {
    devices.forEach((device, deviceId) => {
      automations.value
        .filter(automation => automation.enabled && !recentlyExecuted.has(automation.id))
        .forEach(automation => {
          const deviceTriggers = automation.triggers
            .filter(trigger => trigger.type === 'device' && trigger.deviceId === deviceId);

          deviceTriggers.forEach(trigger => {
            if (checkTrigger(trigger, device) && checkConditions(automation.conditions)) {
              // Add automation to recently executed set
              recentlyExecuted.add(automation.id);
              executeActions(automation.actions);
              // Remove from recently executed after a delay
              setTimeout(() => {
                recentlyExecuted.delete(automation.id);
              }, 2000); // Prevent re-triggering for 2 seconds
            }
          });
        });
    });
  }, 500); // Debounce device trigger checks by 500ms

  function checkTrigger(trigger: Trigger, context: any): boolean {
    switch (trigger.type) {
      case 'device':
        if (!trigger.property || !trigger.value) return false;
        return context.state?.[trigger.property] === trigger.value;
      
      case 'time':
        if (!trigger.time) return false;
        const now = new Date();
        const triggerTime = new Date();
        triggerTime.setHours(trigger.time.hour, trigger.time.minute, 0);
        
        if (trigger.days && !trigger.days.includes(getDayOfWeek(now))) {
          return false;
        }
        
        return now.getTime() === triggerTime.getTime();
      
      case 'state':
        if (!trigger.stateKey || !trigger.stateValue) return false;
        // Implement state checking logic here
        return false;
      
      default:
        return false;
    }
  }

  function checkConditions(conditions: Condition[]): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'device':
          if (!condition.deviceId || !condition.property) return false;
          const device = devices.value.get(condition.deviceId);
          if (!device) return false;

          const value = device.state?.[condition.property];
          return evaluateCondition(value, condition.operator, condition.value);

        case 'time':
          if (!condition.time) return false;
          const now = new Date();
          const time = new Date();
          time.setHours(condition.time.hour, condition.time.minute, 0);

          if (condition.days && !condition.days.includes(getDayOfWeek(now))) {
            return false;
          }

          if (condition.operator === 'between' && condition.endTime) {
            const end = new Date();
            end.setHours(condition.endTime.hour, condition.endTime.minute, 0);
            return now >= time && now <= end;
          }

          return evaluateCondition(now, condition.operator, time);

        case 'state':
          // Implement state condition checking
          return true;

        default:
          return false;
      }
    });
  }

  function executeActions(actions: Action[]) {
    actions.forEach(action => {
      switch (action.type) {
        case 'device':
          if (action.deviceId && action.command) {
            mqttService.sendCommand(action.deviceId, {
              [action.command]: action.value
            });
          }
          break;

        case 'scene':
          if (action.sceneName) {
            // Implement scene activation
          }
          break;

        case 'notification':
          if (action.message) {
            // Implement notification system
            console.log(`[${action.level || 'info'}] ${action.message}`);
          }
          break;
      }
    });
  }

  function evaluateCondition(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'notEquals':
        return value !== target;
      case 'greaterThan':
        return value > target;
      case 'lessThan':
        return value < target;
      case 'contains':
        return Array.isArray(value) ? value.includes(target) : String(value).includes(String(target));
      default:
        return false;
    }
  }

  function getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  function addAutomation(automation: Omit<Automation, 'id'>) {
    const id = crypto.randomUUID();
    const newAutomation = { ...automation, id };
    automations.value.push(newAutomation);
    if (newAutomation.enabled) {
      setupTimeTriggers(newAutomation);
    }
    saveAutomations(); // Save after adding
  }

  function removeAutomation(id: string) {
    const index = automations.value.findIndex(a => a.id === id);
    if (index !== -1) {
      clearAutomationTimers(automations.value[index]);
      automations.value.splice(index, 1);
      saveAutomations(); // Save after removing
    }
  }

  function updateAutomation(automation: Automation) {
    const index = automations.value.findIndex(a => a.id === automation.id);
    if (index !== -1) {
      // Clear existing timers
      clearAutomationTimers(automations.value[index]);
      // Update automation
      automations.value[index] = automation;
      // Setup new timers if enabled
      if (automation.enabled) {
        setupTimeTriggers(automation);
      }
      saveAutomations(); // Save after updating
    }
  }

  function setupTimeTriggers(automation: Automation) {
    if (!automation.enabled) return;

    const timeTriggers = automation.triggers.filter(t => t.type === 'time');
    timeTriggers.forEach(trigger => {
      if (!trigger.time) return;

      const now = new Date();
      const triggerTime = new Date();
      triggerTime.setHours(trigger.time.hour, trigger.time.minute, 0);

      if (triggerTime < now) {
        triggerTime.setDate(triggerTime.getDate() + 1);
      }

      const timeout = setTimeout(() => {
        if (checkConditions(automation.conditions)) {
          executeActions(automation.actions);
        }
        setupTimeTriggers(automation); // Reset for next day
      }, triggerTime.getTime() - now.getTime());

      activeTimers.set(`${automation.id}-${trigger.time.hour}-${trigger.time.minute}`, timeout);
    });
  }

  function clearAutomationTimers(automation: Automation) {
    automation.triggers
      .filter(t => t.type === 'time' && t.time)
      .forEach(trigger => {
        if (!trigger.time) return;
        const key = `${automation.id}-${trigger.time.hour}-${trigger.time.minute}`;
        const timer = activeTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          activeTimers.delete(key);
        }
      });
  }

  return {
    automations,
    addAutomation,
    removeAutomation,
    updateAutomation,
    loadAutomations
  };
}); 
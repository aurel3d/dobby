import fs from 'fs/promises';
import path from 'path';
import { MQTTService } from '../services/MQTTService';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Trigger {
  type: 'device' | 'time' | 'state';
  deviceId?: string;
  property?: string;
  value?: any;
  time?: TimeOfDay;
  days?: DayOfWeek[];
  stateKey?: string;
  stateValue?: any;
}

export interface Condition {
  type: 'device' | 'time' | 'state';
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'between' | 'contains';
  deviceId?: string;
  property?: string;
  value?: any;
  time?: TimeOfDay;
  endTime?: TimeOfDay;
  days?: DayOfWeek[];
  stateKey?: string;
  stateValue?: any;
}

export interface Action {
  type: 'device' | 'scene' | 'notification';
  deviceId?: string;
  command?: string;
  value?: any;
  sceneName?: string;
  message?: string;
  level?: 'info' | 'warning' | 'error';
}

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  triggers: Trigger[];
  conditions: Condition[];
  actions: Action[];
}

export class AutomationManager {
  private automations: Automation[] = [];
  private activeTimers = new Map<string, NodeJS.Timeout>();
  private recentlyExecuted = new Set<string>();
  private storageFile = path.join(__dirname, '../../data/automations.json');

  constructor(private mqttService: MQTTService) {
    // Listen for device state changes
    this.mqttService.on('deviceStateChanged', ({ deviceId, state }) => {
      this.checkDeviceTriggers(deviceId, state);
    });
  }

  async initialize() {
    await this.loadAutomations();
    this.setupAllTimeTriggers();
  }

  private async loadAutomations() {
    try {
      await fs.mkdir(path.dirname(this.storageFile), { recursive: true });
      const data = await fs.readFile(this.storageFile, 'utf-8');
      this.automations = JSON.parse(data);
    } catch (error) {
      console.log('No saved automations found, starting with empty list');
      this.automations = [];
    }
  }

  private async saveAutomations() {
    try {
      await fs.writeFile(this.storageFile, JSON.stringify(this.automations, null, 2));
    } catch (error) {
      console.error('Error saving automations:', error);
    }
  }

  private setupAllTimeTriggers() {
    // Clear existing timers
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeTimers.clear();

    // Setup new timers for all enabled automations
    this.automations
      .filter(automation => automation.enabled)
      .forEach(automation => this.setupTimeTriggers(automation));
  }

  private setupTimeTriggers(automation: Automation) {
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
        if (this.checkConditions(automation.conditions)) {
          this.executeActions(automation.actions);
        }
        this.setupTimeTriggers(automation); // Reset for next day
      }, triggerTime.getTime() - now.getTime());

      const key = `${automation.id}-${trigger.time.hour}-${trigger.time.minute}`;
      this.activeTimers.set(key, timeout);
    });
  }

  private checkDeviceTriggers(deviceId: string, state: any) {
    this.automations
      .filter(automation => automation.enabled && !this.recentlyExecuted.has(automation.id))
      .forEach(automation => {
        const deviceTriggers = automation.triggers
          .filter(trigger => trigger.type === 'device' && trigger.deviceId === deviceId);

        deviceTriggers.forEach(trigger => {
          if (this.checkTrigger(trigger, { state }) && this.checkConditions(automation.conditions)) {
            this.recentlyExecuted.add(automation.id);
            this.executeActions(automation.actions);
            setTimeout(() => {
              this.recentlyExecuted.delete(automation.id);
            }, 2000);
          }
        });
      });
  }

  private checkTrigger(trigger: Trigger, context: any): boolean {
    switch (trigger.type) {
      case 'device':
        if (!trigger.property || !trigger.value) return false;
        return context.state?.[trigger.property] === trigger.value;
      
      case 'time':
        if (!trigger.time) return false;
        const now = new Date();
        const triggerTime = new Date();
        triggerTime.setHours(trigger.time.hour, trigger.time.minute, 0);
        
        if (trigger.days && !trigger.days.includes(this.getDayOfWeek(now))) {
          return false;
        }
        
        return now.getTime() === triggerTime.getTime();
      
      case 'state':
        if (!trigger.stateKey || !trigger.stateValue) return false;
        return false; // Implement state checking if needed
      
      default:
        return false;
    }
  }

  private checkConditions(conditions: Condition[]): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'device':
          if (!condition.deviceId || !condition.property) return false;
          const device = this.mqttService.getDevices().get(condition.deviceId);
          if (!device) return false;

          const value = device.state?.[condition.property];
          return this.evaluateCondition(value, condition.operator, condition.value);

        case 'time':
          if (!condition.time) return false;
          const now = new Date();
          const time = new Date();
          time.setHours(condition.time.hour, condition.time.minute, 0);

          if (condition.days && !condition.days.includes(this.getDayOfWeek(now))) {
            return false;
          }

          if (condition.operator === 'between' && condition.endTime) {
            const end = new Date();
            end.setHours(condition.endTime.hour, condition.endTime.minute, 0);
            return now >= time && now <= end;
          }

          return this.evaluateCondition(now, condition.operator, time);

        case 'state':
          return true; // Implement state condition checking if needed

        default:
          return false;
      }
    });
  }

  private executeActions(actions: Action[]) {
    actions.forEach(action => {
      switch (action.type) {
        case 'device':
          if (action.deviceId && action.command) {
            this.mqttService.sendCommand(action.deviceId, {
              [action.command]: action.value
            });
          }
          break;

        case 'scene':
          if (action.sceneName) {
            // Implement scene activation if needed
          }
          break;

        case 'notification':
          if (action.message) {
            console.log(`[${action.level || 'info'}] ${action.message}`);
            // Implement notification system if needed
          }
          break;
      }
    });
  }

  private evaluateCondition(value: any, operator: string, target: any): boolean {
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

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  // Public API methods
  async addAutomation(automation: Omit<Automation, 'id'>) {
    const id = crypto.randomUUID();
    const newAutomation = { ...automation, id };
    this.automations.push(newAutomation);
    
    if (newAutomation.enabled) {
      this.setupTimeTriggers(newAutomation);
    }
    
    await this.saveAutomations();
    return newAutomation;
  }

  async updateAutomation(automation: Automation) {
    const index = this.automations.findIndex(a => a.id === automation.id);
    if (index === -1) return null;

    // Clear existing timers
    const oldAutomation = this.automations[index];
    this.clearAutomationTimers(oldAutomation);

    // Update automation
    this.automations[index] = automation;

    // Setup new timers if enabled
    if (automation.enabled) {
      this.setupTimeTriggers(automation);
    }

    await this.saveAutomations();
    return automation;
  }

  async removeAutomation(id: string) {
    const index = this.automations.findIndex(a => a.id === id);
    if (index === -1) return false;

    const automation = this.automations[index];
    this.clearAutomationTimers(automation);
    this.automations.splice(index, 1);
    
    await this.saveAutomations();
    return true;
  }

  private clearAutomationTimers(automation: Automation) {
    automation.triggers
      .filter(t => t.type === 'time' && t.time)
      .forEach(trigger => {
        if (!trigger.time) return;
        const key = `${automation.id}-${trigger.time.hour}-${trigger.time.minute}`;
        const timer = this.activeTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.activeTimers.delete(key);
        }
      });
  }

  getAutomations(): Automation[] {
    return this.automations;
  }
} 
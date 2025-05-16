export type TimeOfDay = {
  hour: number;
  minute: number;
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Trigger {
  type: 'device' | 'time' | 'state';
  // Device trigger
  deviceId?: string;
  property?: string;
  value?: any;
  // Time trigger
  time?: TimeOfDay;
  days?: DayOfWeek[];
  // State trigger
  stateKey?: string;
  stateValue?: any;
}

export interface Condition {
  type: 'device' | 'time' | 'state';
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'between' | 'contains';
  // Device condition
  deviceId?: string;
  property?: string;
  value?: any;
  // Time condition
  time?: TimeOfDay;
  endTime?: TimeOfDay;
  days?: DayOfWeek[];
  // State condition
  stateKey?: string;
  stateValue?: any;
}

export interface Action {
  type: 'device' | 'scene' | 'notification';
  // Device action
  deviceId?: string;
  command?: string;
  value?: any;
  // Scene action
  sceneName?: string;
  // Notification action
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
import mqtt from 'mqtt';
import { EventEmitter } from 'events';

export interface Device {
  friendly_name: string;
  ieee_address: string;
  state: Record<string, any>;
  definition: {
    description: string;
    model: string;
    vendor: string;
  };
}

export class MQTTService extends EventEmitter {
  private client: mqtt.MqttClient | null = null;
  private devices = new Map<string, Device>();
  private topicPrefix = 'zigbee2mqtt';

  constructor(private brokerUrl: string) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        this.subscribe();
        resolve();
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error: Error) => {
        console.error('MQTT Error:', error);
        reject(error);
      });
    });
  }

  private subscribe() {
    if (!this.client) return;

    // Subscribe to all device updates
    this.client.subscribe(`${this.topicPrefix}/+`);
    
    // Subscribe to bridge updates
    this.client.subscribe(`${this.topicPrefix}/bridge/+`);
    
    // Request device list
    this.refreshDevices();
  }

  refreshDevices() {
    if (!this.client) return;
    this.client.publish(`${this.topicPrefix}/bridge/request/devices`, '');
  }

  private handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());

      if (topic === `${this.topicPrefix}/bridge/devices`) {
        this.handleDevicesList(payload);
      } else if (topic.startsWith(`${this.topicPrefix}/`) && !topic.includes('bridge')) {
        const deviceId = topic.split('/')[1];
        this.updateDeviceState(deviceId, payload);
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  private handleDevicesList(devices: any[]) {
    devices.forEach(device => {
      if (!device.friendly_name) return;
      
      const existingDevice = this.devices.get(device.ieee_address);
      if (!existingDevice) {
        this.devices.set(device.ieee_address, {
          ...device,
          state: { available: true }
        });
      }
    });

    this.emit('devicesUpdated', this.devices);
  }

  private updateDeviceState(deviceId: string, state: any) {
    const device = Array.from(this.devices.values()).find(d => d.friendly_name === deviceId);
    if (device) {
      device.state = { ...device.state, ...state };
      this.emit('deviceStateChanged', { deviceId, state });
    }
  }

  sendCommand(deviceId: string, command: Record<string, any>) {
    if (!this.client) return;
    
    const device = Array.from(this.devices.values()).find(d => d.friendly_name === deviceId);
    if (!device) {
      console.error(`Device not found: ${deviceId}`);
      return;
    }

    this.client.publish(`${this.topicPrefix}/${deviceId}/set`, JSON.stringify(command));
  }

  getDevices(): Map<string, Device> {
    return this.devices;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }
} 
import mqtt, { MqttClient, IClientOptions, Packet, ISubscriptionMap } from 'mqtt';
import { ref } from 'vue';

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

export const devices = ref<Map<string, Device>>(new Map());
export const isConnected = ref(false);

class MQTTService {
  private client: MqttClient | null = null;
  private topicPrefix: string;

  constructor() {
    this.topicPrefix = import.meta.env.VITE_MQTT_TOPIC_PREFIX || 'zigbee2mqtt';
  }

  connect() {
    const url = 'mqtt://192.168.2.33:9001';
    
    const options: IClientOptions = {
      clientId: 'dobby_' + Math.random().toString(16).substr(2, 8),
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    console.log('Connecting to MQTT broker:', url);
    this.client = mqtt.connect(url, options);

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      isConnected.value = true;
      this.subscribe();
      // Request devices list explicitly
      setTimeout(() => {
        this.requestDevices();
      }, 1000); // Wait 1 second after connection before requesting devices
    });

    this.client.on('message', (topic: string, message: Buffer) => {
      this.handleMessage(topic, message);
    });

    this.client.on('error', (error: Error) => {
      console.error('MQTT Error:', error);
      isConnected.value = false;
    });

    // Add disconnect handler
    this.client.on('disconnect', () => {
      console.log('Disconnected from MQTT broker');
      isConnected.value = false;
    });

    // Add reconnect handler
    this.client.on('reconnect', () => {
      console.log('Attempting to reconnect to MQTT broker');
    });
  }

  private subscribe() {
    if (!this.client) return;
    
    // Subscribe with QoS 1 to ensure message delivery
    const topics: string[] = [
      `${this.topicPrefix}/bridge/devices`,
      `${this.topicPrefix}/bridge/response/devices`,
      `${this.topicPrefix}/+`,
      `${this.topicPrefix}/bridge/state` // Add bridge state subscription
    ];

    topics.forEach(topic => {
      this.client?.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Subscribe error for ${topic}:`, err);
        }
      });
    });
  }

  private requestDevices() {
    if (!this.client) return;
    
    // Send the request
    this.client.publish(
      `${this.topicPrefix}/bridge/request/devices`,
      '',  // Empty payload for request
      { qos: 1 }
    );
  }

  private handleMessage(topic: string, message: Buffer) {
    try {
      const messageStr = message.toString();
      const payload = JSON.parse(messageStr);
      
      // Special handling for bridge state
      if (topic === `${this.topicPrefix}/bridge/state`) {
        return;
      }

      if (topic === `${this.topicPrefix}/bridge/devices` || 
          topic === `${this.topicPrefix}/bridge/response/devices`) {
        // Handle devices list update
        if (Array.isArray(payload)) {
          payload.forEach((device: Device) => {
            // Initialize state with availability if not present
            if (!device.state) {
              device.state = {};
            }
            // Check if device already exists
            const existingDevice = devices.value.get(device.friendly_name);
            if (existingDevice) {
              // Preserve existing state
              device.state = { ...existingDevice.state, ...device.state };
            }
            // Ensure availability is set
            if (device.state.available === undefined) {
              device.state.available = true;
            }
            devices.value.set(device.friendly_name, device);
          });
          // Force reactivity update
          devices.value = new Map(devices.value);
        }
      } else {
        // Handle device state updates
        const deviceName = topic.split('/')[1];
        const device = devices.value.get(deviceName);
        if (device) {
          // If payload has linkquality, device is available
          if ('linkquality' in payload) {
            payload.available = true;
          }

          // Check if state actually changed
          const hasChanges = Object.entries(payload).some(([key, value]) => {
            // Ignore linkquality changes as they don't affect functionality
            if (key === 'linkquality') return false;
            return device.state[key] !== value;
          });

          if (hasChanges) {
            console.log('State change detected for device:', deviceName, 'New state:', payload);
            device.state = { ...device.state, ...payload };
            devices.value.set(deviceName, device);
            // Force reactivity update
            devices.value = new Map(devices.value);
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  sendCommand(deviceName: string, command: Record<string, any>) {
    if (!this.client) return;
    
    this.client.publish(
      `${this.topicPrefix}/${deviceName}/set`,
      JSON.stringify(command),
      { qos: 1 }
    );
  }

  // Method to manually refresh devices list
  refreshDevices() {
    console.log('Manually refreshing devices list');
    this.requestDevices();
  }

  // Method to turn off all lights
  turnOffAllLights() {
    if (!this.client) return;
    
    // Get all devices that are lights (check both description and features)
    const lights = Array.from(devices.value.values()).filter(device => {
      return device.definition?.description?.toLowerCase().includes('light') ||
        device.state?.brightness !== undefined ||
        device.state?.color !== undefined ||
        device.state?.color_temp !== undefined ||
        device.state?.state === 'ON' || device.state?.state === 'OFF';
    });
    
    // Turn off each light
    lights.forEach(light => {
      this.sendCommand(light.friendly_name, {
        state: 'OFF'
      });
    });
  }
}

export const mqttService = new MQTTService();
export default mqttService; 
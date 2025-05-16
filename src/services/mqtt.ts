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
      console.log('Received message on topic:', topic);
      console.log('Raw message:', message.toString());
      this.handleMessage(topic, message);
    });

    this.client.on('error', (error: Error) => {
      console.error('MQTT Error:', error);
      isConnected.value = false;
    });

    // Log when subscriptions are completed
    this.client.on('packetreceive', (packet: Packet) => {
      if (packet.cmd === 'suback') {
        console.log('Subscriptions confirmed');
      }
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
    console.log('Subscribing to topics with prefix:', this.topicPrefix);
    
    // Subscribe with QoS 1 to ensure message delivery
    const topics: string[] = [
      `${this.topicPrefix}/bridge/devices`,
      `${this.topicPrefix}/bridge/response/devices`,
      `${this.topicPrefix}/+`,
      `${this.topicPrefix}/bridge/state` // Add bridge state subscription
    ];

    topics.forEach(topic => {
      this.client?.subscribe(topic, { qos: 1 }, (err, granted) => {
        if (err) {
          console.error(`Subscribe error for ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}:`, granted);
        }
      });
    });
  }

  private requestDevices() {
    if (!this.client) return;
    console.log('Requesting devices list...');
    
    // Send the request
    this.client.publish(
      `${this.topicPrefix}/bridge/request/devices`,
      '',  // Empty payload for request
      { qos: 1 },
      (err) => {
        if (err) {
          console.error('Error publishing device request:', err);
        } else {
          console.log('Device request sent successfully');
        }
      }
    );
  }

  private handleMessage(topic: string, message: Buffer) {
    try {
      const messageStr = message.toString();
      console.log(`Processing message for topic ${topic}:`, messageStr);
      
      // Special handling for bridge state
      if (topic === `${this.topicPrefix}/bridge/state`) {
        console.log('Received bridge state:', messageStr);
        return;
      }

      const payload = JSON.parse(messageStr);
      
      if (topic === `${this.topicPrefix}/bridge/devices` || 
          topic === `${this.topicPrefix}/bridge/response/devices`) {
        // Handle devices list update
        console.log('Processing devices list. Current device count:', devices.value.size);
        if (Array.isArray(payload)) {
          payload.forEach((device: Device) => {
            console.log('Processing device:', device.friendly_name, 'Current state:', device.state);
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
              device.state.available = true; // Default to true when device is discovered
            }
            console.log('Setting device with state:', device.state);
            devices.value.set(device.friendly_name, device);
          });
          console.log('Updated devices list. New device count:', devices.value.size);
          // Force reactivity update
          devices.value = new Map(devices.value);
        } else {
          console.warn('Received devices payload is not an array:', payload);
        }
      } else {
        // Handle device state updates
        const deviceName = topic.split('/')[1];
        const device = devices.value.get(deviceName);
        if (device) {
          console.log('Updating state for device:', deviceName);
          console.log('Current state:', device.state);
          console.log('New state payload:', payload);
          
          // If payload has linkquality, device is available
          if ('linkquality' in payload) {
            payload.available = true;
          }
          
          device.state = { ...device.state, ...payload };
          console.log('Updated state:', device.state);
          devices.value.set(deviceName, device);
          // Force reactivity update
          devices.value = new Map(devices.value);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      console.error('Raw message content:', message.toString());
    }
  }

  sendCommand(deviceName: string, command: Record<string, any>) {
    if (!this.client) return;
    console.log('Sending command to device:', deviceName, command);
    this.client.publish(
      `${this.topicPrefix}/${deviceName}/set`,
      JSON.stringify(command),
      { qos: 1 },
      (err) => {
        if (err) {
          console.error('Error sending command:', err);
        } else {
          console.log('Command sent successfully');
        }
      }
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
    console.log('Turning off all lights...');
    
    // Log all devices and their descriptions
    console.log('All devices:', Array.from(devices.value.values()).map(d => ({
      name: d.friendly_name,
      description: d.definition?.description,
      state: d.state
    })));
    
    // Get all devices that are lights (check both description and features)
    const lights = Array.from(devices.value.values()).filter(device => {
      const isLight = 
        // Check description
        device.definition?.description?.toLowerCase().includes('light') ||
        // Check if device has brightness or color features
        device.state?.brightness !== undefined ||
        device.state?.color !== undefined ||
        device.state?.color_temp !== undefined ||
        // Check if device has state ON/OFF capability
        device.state?.state === 'ON' || device.state?.state === 'OFF';
      
      if (isLight) {
        console.log(`Found light: ${device.friendly_name}`, device);
      }
      return isLight;
    });
    
    console.log(`Found ${lights.length} lights to turn off`);
    
    // Turn off each light
    lights.forEach(light => {
      console.log(`Turning off light: ${light.friendly_name}`);
      this.sendCommand(light.friendly_name, {
        state: 'OFF'
      });
    });
  }
}

export const mqttService = new MQTTService();
export default mqttService; 
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
      `${this.topicPrefix}/+`
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
      const payload = JSON.parse(message.toString());
      console.log('Parsed message for topic', topic, ':', payload);
      
      if (topic === `${this.topicPrefix}/bridge/devices` || 
          topic === `${this.topicPrefix}/bridge/response/devices`) {
        // Handle devices list update
        console.log('Processing devices list. Current device count:', devices.value.size);
        if (Array.isArray(payload)) {
          payload.forEach((device: Device) => {
            console.log('Adding device:', device.friendly_name);
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
          device.state = { ...device.state, ...payload };
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
}

export const mqttService = new MQTTService();
export default mqttService; 
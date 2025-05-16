import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import { AutomationManager } from './automation/AutomationManager';
import { MQTTService } from './services/MQTTService';
import { automationRoutes } from './routes/automationRoutes';

// Load environment variables
const envResult = config({ path: path.join(__dirname, '../.env') });
if (envResult.error) {
  console.warn('Warning: .env file not found or invalid');
}

// Log environment variables (without sensitive data)
console.log('Environment Configuration:');
console.log('- PORT:', process.env.PORT || 3000);
console.log('- MQTT_BROKER_URL:', process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Initialize services
const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
console.log('Connecting to MQTT broker at:', mqttBrokerUrl);
export const mqttService = new MQTTService(mqttBrokerUrl);
export const automationManager = new AutomationManager(mqttService);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is accessible' });
});

// Routes
app.use('/api/automations', automationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mqtt: mqttService.isConnected() ? 'connected' : 'disconnected'
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  
  // Try to connect to MQTT broker
  mqttService.connect().then(() => {
    console.log('Successfully connected to MQTT broker');
    automationManager.initialize();
  }).catch(error => {
    console.warn('Warning: Failed to connect to MQTT broker. Running in limited mode.');
    console.warn('MQTT-dependent features will not work.');
    console.warn('Error details:', error.message);
    // Still initialize automation manager for non-MQTT features
    automationManager.initialize();
  });
}); 
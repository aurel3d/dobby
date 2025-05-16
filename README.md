# Dobby Home Automation

A smart home automation system with Vue.js client and Express server.

## Deployment Guide

### Prerequisites

- Docker and Docker Compose installed on your server
- Git installed
- Basic knowledge of terminal/command line

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dobby-automation.git
   cd dobby-automation
   ```

2. Create environment file:
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration.

3. Deploy the application:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh start
   ```

The application will be available at:
- Web Interface: http://your-server:3000
- MQTT Broker: mqtt://your-server:1883
- WebSocket MQTT: ws://your-server:9001

### Deployment Commands

The `deploy.sh` script provides several commands to manage your deployment:

- `./deploy.sh start` - Start the application
- `./deploy.sh stop` - Stop the application
- `./deploy.sh restart` - Restart the application
- `./deploy.sh logs` - View application logs
- `./deploy.sh update` - Pull latest changes and rebuild

### Directory Structure

```
├── src/
│   ├── client/     # Vue.js frontend
│   ├── server/     # Express backend
│   └── types/      # TypeScript definitions
├── docker-compose.yml
├── Dockerfile
├── deploy.sh
└── mosquitto.conf
```

### Configuration

1. Environment Variables:
   - `PORT`: Server port (default: 3000)
   - `MQTT_BROKER_URL`: MQTT broker URL
   - `JWT_SECRET`: Secret key for JWT tokens
   - See `env.example` for all options

2. MQTT Configuration:
   - Edit `mosquitto.conf` for MQTT broker settings
   - Default ports: 1883 (MQTT), 9001 (WebSocket)

### Updating

To update to the latest version:

```bash
./deploy.sh update
```

### Troubleshooting

1. Check logs:
   ```bash
   ./deploy.sh logs
   ```

2. Common issues:
   - Port conflicts: Edit `docker-compose.yml` to change ports
   - MQTT connection: Check broker status and credentials
   - Permission issues: Ensure proper file permissions

### Security Notes

1. Change default passwords in production
2. Use SSL/TLS for MQTT and web traffic
3. Configure firewall rules
4. Regular updates and monitoring

## License

MIT License - see LICENSE file for details

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

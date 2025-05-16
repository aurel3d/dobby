#!/bin/bash

# Function to display usage
show_usage() {
    echo "Usage: ./deploy.sh [command]"
    echo "Commands:"
    echo "  start     - Start the application in production mode"
    echo "  stop      - Stop the application"
    echo "  restart   - Restart the application"
    echo "  logs      - Show application logs"
    echo "  update    - Pull latest changes and rebuild"
}

case "$1" in
    start)
        docker-compose up -d
        ;;
    stop)
        docker-compose down
        ;;
    restart)
        docker-compose restart
        ;;
    logs)
        docker-compose logs -f
        ;;
    update)
        git pull
        docker-compose build
        docker-compose up -d
        ;;
    *)
        show_usage
        exit 1
        ;;
esac 
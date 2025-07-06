# Development Scripts

This directory contains helpful scripts for development and testing.

## Available Scripts

### setup.sh
- Sets up the development environment
- Installs dependencies for both backend and client
- Creates necessary directories and files

### test-notification.sh
- Sends a test notification via curl
- Useful for testing the API without the web interface

### start-dev.sh
- Starts both backend and client in development mode
- Uses concurrent processes for easy development

Usage:
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/start-dev.sh
```

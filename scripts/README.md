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

### test-cors.sh
- Tests CORS configuration with different localhost ports
- Verifies that the backend accepts requests from any localhost origin
- Useful for debugging CORS-related issues

### start-dev.sh
- Starts both backend and client in development mode
- Uses concurrent processes for easy development

Usage:
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/start-dev.sh
```

## Troubleshooting

### CORS Errors
If you see CORS (Cross-Origin Resource Sharing) errors like:
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:XXXX' has been blocked by CORS policy
```

This happens when your client is running on a different port than expected. The backend CORS configuration has been updated to allow any localhost port in development mode.

**Quick fix**: Restart the backend server:
```bash
cd backend && npm run dev
```

### Service Worker Errors
If you see service worker fetch errors, ensure:
1. Your client is served over HTTP/HTTPS (not file://)
2. The backend server is running on port 3000
3. No browser extensions are blocking requests

### Port Conflicts
If you get "address already in use" errors:
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

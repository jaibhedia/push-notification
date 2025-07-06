# Push Notification System MVP - Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Firebase Project** with Cloud Messaging enabled
3. **Git** (optional, for version control)

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable **Cloud Messaging** in the project settings

### 2. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** > **General**
2. Scroll down to "Your apps" and click "Add app" > Web
3. Register your app and copy the Firebase config object
4. Go to **Project Settings** > **Cloud Messaging**
5. Copy the **VAPID key** from the Web configuration section

### 3. Get Service Account Key

1. Go to **Project Settings** > **Service Accounts**
2. Click "Generate new private key"
3. Download the JSON file containing your service account credentials

## Installation & Configuration

### 1. Clone/Download the Project

```bash
cd /Users/shantanuswami/Downloads/open
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` file with your Firebase credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:8080

# Firebase Configuration (from service account JSON)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# Database Configuration
DATABASE_PATH=./data/notifications.db
```

### 3. Client Setup

```bash
cd ../client
npm install
```

Edit `public/config.js` with your Firebase web app configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

const VAPID_KEY = 'your-vapid-key';
```

Also update the Firebase config in `public/sw.js` with the same configuration.

## Running the Application

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3000`

### 2. Start Client Application

```bash
cd client
npm start
```

The client will start on `http://localhost:8080`

## Testing the System

### 1. Open the Web Application

Navigate to `http://localhost:8080` in your browser

### 2. Request Notification Permission

1. Click "Request Notification Permission"
2. Allow notifications when prompted by the browser

### 3. Register Device

1. Click "Register Device"
2. Your device token will be displayed and registered with the backend

### 4. Send Test Notification

1. Click "Send Test Notification" to test the system
2. Or fill out the notification form and send to all devices

## API Endpoints

### Device Management

- `POST /api/devices/register` - Register a device token
- `GET /api/devices/tokens` - Get all active tokens
- `GET /api/devices/stats` - Get device statistics
- `DELETE /api/devices/token/:token` - Deactivate a token

### Notifications

- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/history` - Get notification history
- `GET /api/notifications/stats` - Get notification statistics
- `GET /api/notifications/:id` - Get specific notification

## Project Structure

```
push-notification-mvp/
├── backend/                 # Node.js backend server
│   ├── src/
│   │   ├── controllers/     # Route handlers (future)
│   │   ├── models/         # Database models
│   │   │   ├── database.js # Database initialization
│   │   │   ├── Device.js   # Device token management
│   │   │   └── Notification.js # Notification management
│   │   ├── services/       # Business logic
│   │   │   └── firebaseService.js # FCM integration
│   │   └── routes/         # API routes
│   │       ├── devices.js  # Device-related routes
│   │       └── notifications.js # Notification routes
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── server.js           # Main server file
├── client/                 # Web client application
│   ├── public/
│   │   ├── index.html      # Main HTML file
│   │   ├── app.js          # Main application logic
│   │   ├── config.js       # Configuration file
│   │   ├── sw.js           # Service Worker
│   │   └── manifest.json   # Web App Manifest
│   └── package.json
└── README.md               # This file
```

## Troubleshooting

### Common Issues

1. **"Permission denied" error**
   - Ensure notification permissions are granted
   - Check browser console for errors

2. **"Firebase not initialized" error**
   - Verify Firebase configuration in config.js
   - Check that all required Firebase keys are set

3. **"Token registration failed" error**
   - Ensure backend server is running
   - Check network connectivity
   - Verify CORS settings

4. **Notifications not appearing**
   - Check notification permissions
   - Verify service worker registration
   - Check browser console for errors

### Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Limited support (iOS 16.4+)
- **Edge**: Full support

### Security Notes

- Never commit `.env` files to version control
- Use HTTPS in production
- Implement proper authentication for production use
- Validate all user inputs
- Implement rate limiting for production

## Next Steps

After the MVP is working, consider adding:

1. **User Authentication**
2. **Notification Scheduling**
3. **Rich Media Notifications**
4. **Analytics and Reporting**
5. **Mobile App Support**
6. **Notification Templates**
7. **A/B Testing**
8. **Segmentation**

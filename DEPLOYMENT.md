# 🚀 Firebase Deployment Guide

## 📋 Prerequisites

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Verify project connection**:
   ```bash
   firebase projects:list
   ```

## 🛠️ Manual Deployment Steps

### 1. Install Dependencies
```bash
cd functions
npm install
cd ..
```

### 2. Test Locally (Optional)
```bash
# Start Firebase emulators
firebase emulators:start

# Your app will be available at:
# - Frontend: http://localhost:5000
# - Functions: http://localhost:5001/notification-a480a/us-central1/api
```

### 3. Deploy to Production
```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

## 🎯 Quick Deployment

Simply run the deployment script:
```bash
./deploy.sh
```

## 🌐 Production URLs

After deployment, your app will be available at:
- **Frontend**: https://notification-a480a.web.app
- **API**: https://notification-a480a.web.app/api

## 🔧 Environment Variables

Firebase Functions automatically provides:
- ✅ Firebase Admin SDK credentials
- ✅ Project configuration
- ✅ Firestore access

No manual environment variable setup needed!

## 📱 Testing After Deployment

1. Visit your deployed app URL
2. Click "Request Notification Permission"
3. Register device and send test notifications
4. Check Firebase Console for logs and analytics

## 🚨 Troubleshooting

### Functions not working?
```bash
firebase functions:log
```

### Hosting issues?
```bash
firebase hosting:channel:deploy preview
```

### Database problems?
- Check Firestore rules in Firebase Console
- Verify Firestore is enabled for your project

## 🎉 You're all set!

Your push notification app is now running on Firebase with:
- ✅ Global CDN hosting
- ✅ Auto-scaling Cloud Functions
- ✅ Integrated Firebase services
- ✅ SSL certificates included

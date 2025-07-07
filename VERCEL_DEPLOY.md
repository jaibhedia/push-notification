# Vercel Deployment Guide

This guide will help you deploy the Push Notification App to Vercel with full backend and frontend functionality.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Will be installed automatically by the deployment script
3. **Firebase Project**: You should have the Firebase credentials from `backend/.env`

## Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
./deploy-vercel.sh
```

### Option 2: Manual Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add FIREBASE_PROJECT_ID
   # Enter: notification-a480a
   
   vercel env add FIREBASE_CLIENT_EMAIL
   # Enter: firebase-adminsdk-fbsvc@notification-a480a.iam.gserviceaccount.com
   
   vercel env add FIREBASE_PRIVATE_KEY
   # Enter the entire private key from backend/.env (including BEGIN/END lines)
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

## Environment Variables

The following environment variables are required for Vercel deployment:

| Variable | Value | Source |
|----------|-------|--------|
| `FIREBASE_PROJECT_ID` | `notification-a480a` | `backend/.env` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@notification-a480a.iam.gserviceaccount.com` | `backend/.env` |
| `FIREBASE_PRIVATE_KEY` | The entire private key including BEGIN/END lines | `backend/.env` |

### Setting Environment Variables via Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable for **Production**, **Preview**, and **Development** environments

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── devices/
│   │   ├── register.js     # POST /api/devices/register
│   │   ├── tokens.js       # GET /api/devices/tokens
│   │   └── stats.js        # GET /api/devices/stats
│   ├── notifications/
│   │   ├── send.js         # POST /api/notifications/send
│   │   └── stats.js        # GET /api/notifications/stats
│   └── src/                # Shared models and services
├── public/                 # Static frontend files
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── deploy-vercel.sh       # Deployment script
```

## API Endpoints

Once deployed, your API will be available at:

- **Device Registration**: `POST /api/devices/register`
- **Get Tokens**: `GET /api/devices/tokens`
- **Device Stats**: `GET /api/devices/stats`
- **Send Notification**: `POST /api/notifications/send`
- **Notification Stats**: `GET /api/notifications/stats`

## Frontend Access

The frontend will be available at your Vercel domain (e.g., `https://your-app.vercel.app`).

## Testing the Deployment

1. **Access the frontend** at your Vercel URL
2. **Test notification registration** by clicking "Enable Notifications"
3. **Send a test notification** using the admin interface
4. **Check the console** for any errors

## Troubleshooting

### Common Issues

1. **Database Path Error**
   - Vercel functions use `/tmp` for temporary storage
   - Database is recreated on each function invocation (data is not persistent)
   - For persistent storage, consider upgrading to Vercel KV or external database

2. **Environment Variables Not Set**
   - Ensure all three Firebase environment variables are set
   - Check variable names match exactly (case sensitive)
   - Redeploy after setting variables

3. **CORS Issues**
   - API endpoints include CORS headers for cross-origin requests
   - Check browser console for CORS errors

4. **Firebase Permissions**
   - Ensure Firebase service account has necessary permissions
   - Check Firebase Console for any permission errors

### Logs and Debugging

1. **Function Logs**: Check Vercel dashboard → Functions → View Logs
2. **Real-time Logs**: Run `vercel logs` in terminal
3. **Local Testing**: Run `vercel dev` for local development

## Database Considerations

⚠️ **Important**: Vercel serverless functions use ephemeral storage (`/tmp`). The SQLite database is recreated on each function invocation, so data is not persistent between requests.

### Options for Persistent Storage:

1. **Vercel KV** (Redis): Recommended for production
2. **External Database**: PostgreSQL, MySQL, etc.
3. **Firebase Firestore**: Use Firebase's database instead of SQLite

## Performance Notes

- Cold starts may take 1-2 seconds for first request
- Database initialization happens on each function call
- Consider upgrading to persistent storage for better performance

## Support

If you encounter issues:
1. Check the Vercel dashboard for deployment logs
2. Verify environment variables are set correctly
3. Test API endpoints directly using curl or Postman
4. Check Firebase Console for authentication issues

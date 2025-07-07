const admin = require('firebase-admin');

let firebaseApp;

/**
 * Initialize Firebase Admin SDK
 */
async function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      return firebaseApp;
    }

    // Firebase configuration from environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    // Validate required environment variables
    const requiredFields = ['project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    throw error;
  }
}

/**
 * Send push notification to a single device
 */
async function sendNotificationToDevice(token, notification, data = {}) {
  try {
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.image && { image: notification.image })
      },
      data: {
        // Convert all data values to strings as required by FCM
        ...Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, String(value)])),
        click_action: String(notification.clickAction || ''),
        timestamp: new Date().toISOString()
      },
      webpush: {
        headers: {
          'Urgency': 'high'
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          ...(notification.image && { image: notification.image }),
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View',
              icon: '/action-view.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/action-dismiss.png'
            }
          ]
        },
        fcm_options: {
          link: notification.clickAction || '/'
        }
      }
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification to device:', error);
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code
    };
  }
}

/**
 * Send push notification to multiple devices
 */
async function sendNotificationToMultipleDevices(tokens, notification, data = {}) {
  try {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      throw new Error('Tokens must be a non-empty array');
    }

    // FCM supports up to 500 tokens per request
    const batchSize = 500;
    const results = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const message = {
        tokens: batch,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.image && { image: notification.image })
        },
        data: {
          // Convert all data values to strings as required by FCM
          ...Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, String(value)])),
          click_action: String(notification.clickAction || ''),
          timestamp: new Date().toISOString()
        },
        webpush: {
          headers: {
            'Urgency': 'high'
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            ...(notification.image && { image: notification.image }),
            requireInteraction: true
          },
          fcm_options: {
            link: notification.clickAction || '/'
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      results.push({
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      });
    }

    // Aggregate results
    const aggregated = results.reduce((acc, batch) => ({
      successCount: acc.successCount + batch.successCount,
      failureCount: acc.failureCount + batch.failureCount,
      responses: acc.responses.concat(batch.responses)
    }), { successCount: 0, failureCount: 0, responses: [] });

    return {
      success: true,
      totalTokens: tokens.length,
      ...aggregated
    };
  } catch (error) {
    console.error('Error sending notifications to multiple devices:', error);
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
}

/**
 * Validate FCM token format
 */
function validateToken(token) {
  // Basic FCM token validation
  if (typeof token !== 'string' || token.length < 50) {
    return false;
  }
  
  // For development/testing: be very permissive
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG] Validating token in dev mode: length=${token.length}, valid=true`);
    return true; // Allow all tokens in development
  }
  
  // FCM tokens can contain alphanumeric characters, hyphens, underscores, colons, and dots
  const tokenRegex = /^[a-zA-Z0-9_:.-]+$/;
  return tokenRegex.test(token);
}

/**
 * Get Firebase messaging instance
 */
function getMessaging() {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.messaging();
}

module.exports = {
  initializeFirebase,
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
  validateToken,
  getMessaging
};

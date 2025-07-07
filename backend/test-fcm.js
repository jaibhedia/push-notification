// Simple FCM test script
const admin = require('firebase-admin');

async function testFCM() {
  try {
    // Load environment variables
    require('dotenv').config();
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    console.log('🔧 Initializing Firebase Admin...');
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Project ID:', serviceAccount.project_id);
    console.log('📧 Client Email:', serviceAccount.client_email);
    
    // Test with a valid-looking token (this should fail gracefully if token is invalid)
    const testToken = 'dJWkTSgGp8fa7fWVQ0LtAT:APA91bFxECJ5V8pLdl3bD14MJwuc-GxZgqf5EUjRDUQnHW7n4CSlQErbtCqTWywmyj0L5TYUxmhngtgoPpB963jozPMJqcJrCni0FM6gCPPlVJy44b-Z6Bc';
    
    console.log('📱 Testing FCM with token:', testToken.substring(0, 30) + '...');
    
    const message = {
      notification: {
        title: 'Test Notification',
        body: 'Testing FCM configuration'
      },
      data: {
        test: 'true'
      },
      token: testToken
    };

    const response = await admin.messaging().send(message);
    console.log('🎉 FCM test successful! Message ID:', response);
    
  } catch (error) {
    console.error('❌ FCM test failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.code === 'messaging/invalid-registration-token') {
      console.log('💡 This means the token is invalid/expired, but FCM service is working');
    } else if (error.code === 'messaging/authentication-error') {
      console.log('💡 This means there is an issue with Firebase credentials');
    } else {
      console.log('💡 Error details:', error);
    }
  }
}

testFCM();

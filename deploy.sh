#!/bin/bash

echo "🚀 Deploying Push Notification App to Firebase"
echo "=============================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔑 Please login to Firebase..."
    firebase login
fi

# Install functions dependencies
echo "📦 Installing Functions dependencies..."
cd functions
npm install
cd ..

# Build and deploy
echo "🔨 Building and deploying..."
firebase deploy

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://notification-a480a.web.app"

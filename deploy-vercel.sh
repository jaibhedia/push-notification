#!/bin/bash

echo "🚀 Preparing Push Notification App for Vercel Deployment"
echo "========================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Environment Variables Setup Required"
echo "======================================="
echo ""
echo "Before deploying, you need to set these environment variables in Vercel:"
echo ""
echo "Required Firebase Environment Variables:"
echo "----------------------------------------"
echo "FIREBASE_PROJECT_ID=notification-a480a"
echo "FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@notification-a480a.iam.gserviceaccount.com"
echo ""
echo "FIREBASE_PRIVATE_KEY="
echo "Copy the entire private key from backend/.env (including BEGIN/END lines)"
echo ""
echo "📁 Your Firebase credentials are in: backend/.env"
echo ""
echo "To set environment variables:"
echo "1. Run: vercel env add FIREBASE_PROJECT_ID"
echo "2. Run: vercel env add FIREBASE_CLIENT_EMAIL"
echo "3. Run: vercel env add FIREBASE_PRIVATE_KEY"
echo ""
echo "Or set them through the Vercel dashboard:"
echo "1. Go to vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Environment Variables"
echo ""

read -p "Have you set up the environment variables? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set up environment variables first, then run 'vercel --prod' to deploy."
    exit 1
fi

echo "✅ Ready for deployment!"
echo ""
echo "To deploy to Vercel, run:"
echo "vercel --prod"
echo ""
echo "Files are ready for Vercel deployment:"
echo "✓ vercel.json - Vercel configuration"
echo "✓ package.json - Dependencies and scripts"
echo "✓ api/ - Serverless API functions"
echo "✓ public/ - Static frontend files"

#!/bin/bash

# Test notification script
# Sends a test notification via the API

API_BASE_URL="http://localhost:3000/api"

echo "🧪 Sending test notification..."

# Test notification payload
curl -X POST "${API_BASE_URL}/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Test Notification",
    "body": "This is a test notification sent via API",
    "targetTokens": "all",
    "data": {
      "test": true,
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  }' \
  | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

echo ""
echo "✅ Test notification sent!"
echo "💡 Check the web client or your registered devices for the notification"

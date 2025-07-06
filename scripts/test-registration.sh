#!/bin/bash

# Device registration test script

API_BASE_URL="http://localhost:3000/api"

echo "📱 Testing device registration and notification flow..."

echo ""
echo "Step 1: Check backend health"
curl -s "$API_BASE_URL/../health" | jq '.' 2>/dev/null || echo "Backend health check failed"

echo ""
echo "Step 2: Check current registered devices"
devices_response=$(curl -s "$API_BASE_URL/devices/tokens")
echo "$devices_response" | jq '.' 2>/dev/null || echo "$devices_response"
device_count=$(echo "$devices_response" | jq -r '.count' 2>/dev/null || echo "0")
echo "Current registered devices: $device_count"

echo ""
echo "Step 3: Register a test device"
test_token="test-device-token-$(date +%s)"
register_response=$(curl -s -X POST "$API_BASE_URL/devices/register" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$test_token'",
    "platform": "web",
    "userId": "test-user-'$(date +%s)'",
    "userAgent": "Test Registration Script"
  }')

echo "$register_response" | jq '.' 2>/dev/null || echo "$register_response"

echo ""
echo "Step 4: Check devices again"
devices_response2=$(curl -s "$API_BASE_URL/devices/tokens")
echo "$devices_response2" | jq '.' 2>/dev/null || echo "$devices_response2"
device_count2=$(echo "$devices_response2" | jq -r '.count' 2>/dev/null || echo "0")
echo "Devices after registration: $device_count2"

echo ""
echo "Step 5: Test notification to all devices"
notification_response=$(curl -s -X POST "$API_BASE_URL/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification from the registration script",
    "targetTokens": "all",
    "data": {
      "test": true,
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }
  }')

echo "$notification_response" | jq '.' 2>/dev/null || echo "$notification_response"

echo ""
echo "✅ Device registration test completed!"
echo "💡 If you see 'No devices available' error, the web client token registration isn't working."
echo "💡 Open http://localhost:8080 and click 'Register Device' to register a real FCM token."

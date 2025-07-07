#!/bin/bash

# Device Registration and Notification Test Script

API_BASE_URL="http://localhost:3001/api"

echo "🔍 Push Notification System - Device Test"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_backend_connection() {
    echo -e "\n${BLUE}1. Testing Backend Connection${NC}"
    echo "----------------------------"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/../health")
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Backend is running and healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend is not responding (HTTP $response)${NC}"
        return 1
    fi
}

check_registered_devices() {
    echo -e "\n${BLUE}2. Checking Registered Devices${NC}"
    echo "------------------------------"
    
    devices=$(curl -s "$API_BASE_URL/devices/tokens")
    if [ $? -eq 0 ]; then
        echo "Response from backend:"
        echo "$devices" | jq '.' 2>/dev/null || echo "$devices"
        
        device_count=$(echo "$devices" | jq -r '.count' 2>/dev/null || echo "0")
        echo -e "\n${BLUE}Total registered devices: $device_count${NC}"
        
        if [ "$device_count" -gt 0 ]; then
            echo -e "${GREEN}✅ Devices are registered${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  No devices registered yet${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Could not fetch device list${NC}"
        return 1
    fi
}

register_test_device() {
    echo -e "\n${BLUE}3. Registering Test Device${NC}"
    echo "--------------------------"
    
    # Generate a realistic test token (FCM tokens are typically 163+ characters)
    test_token="fKqWqPzGRk2x5YJLtj4Qgp:APA91bHJGfX5YJ8Z4Qgp3Kl7Mn9Rt2Sx6Vw8Yz0Bc1Df2Gh3Jk4Lm5Np6Qr7St8Uv9Wx0Yz1Ac2Bd3Ce4Df5Eg6Fh7Gi8Hj9Ik0Jl1Km2Ln3Mo4Np5Oq6Pr7Qs8Rt9Su0Tv1Uw2Vx3Wy4Xz5Ya6Zb7"
    user_id="test-user-$(date +%s)"
    
    echo "Registering device with:"
    echo "  Token: ${test_token:0:30}..."
    echo "  User ID: $user_id"
    
    register_response=$(curl -s -X POST "$API_BASE_URL/devices/register" \
        -H "Content-Type: application/json" \
        -d '{
            "token": "'$test_token'",
            "platform": "web",
            "userId": "'$user_id'",
            "userAgent": "Device Test Script"
        }')
    
    echo "Registration response:"
    echo "$register_response" | jq '.' 2>/dev/null || echo "$register_response"
    
    # Check if registration was successful
    if echo "$register_response" | grep -q '"success".*true\|"deviceId"' 2>/dev/null; then
        echo -e "${GREEN}✅ Test device registered successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Test device registration failed${NC}"
        return 1
    fi
}

test_notification_sending() {
    echo -e "\n${BLUE}4. Testing Notification Sending${NC}"
    echo "-------------------------------"
    
    notification_data='{
        "title": "🧪 Test Notification",
        "body": "This is a test notification from the device test script",
        "targetTokens": "all",
        "data": {
            "test": true,
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "source": "device-test-script"
        }
    }'
    
    echo "Sending notification to all devices..."
    
    send_response=$(curl -s -X POST "$API_BASE_URL/notifications/send" \
        -H "Content-Type: application/json" \
        -d "$notification_data")
    
    echo "Send response:"
    echo "$send_response" | jq '.' 2>/dev/null || echo "$send_response"
    
    # Check if sending was successful
    if echo "$send_response" | grep -q '"success".*true' 2>/dev/null; then
        echo -e "${GREEN}✅ Notification sent successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Notification sending failed${NC}"
        return 1
    fi
}

get_system_stats() {
    echo -e "\n${BLUE}5. System Statistics${NC}"
    echo "-------------------"
    
    echo "Device Statistics:"
    curl -s "$API_BASE_URL/devices/stats" | jq '.' 2>/dev/null || echo "Stats unavailable"
    
    echo -e "\nNotification Statistics:"
    curl -s "$API_BASE_URL/notifications/stats" | jq '.' 2>/dev/null || echo "Stats unavailable"
}

run_web_client_test() {
    echo -e "\n${BLUE}6. Web Client Test Instructions${NC}"
    echo "------------------------------"
    
    echo -e "${YELLOW}Manual steps to test the web client:${NC}"
    echo "1. Open http://localhost:8080 in your browser"
    echo "2. Open browser DevTools (F12) and check Console tab"
    echo "3. Click 'Request Notification Permission' and allow"
    echo "4. Click 'Register Device' button"
    echo "5. Look for these success messages in console:"
    echo "   - 'FCM Token obtained: ...'"
    echo "   - 'Token registered with backend!'"
    echo "   - 'Current device found in backend registry'"
    echo "6. Try sending a test notification"
    echo ""
    echo -e "${BLUE}Expected console output (no errors):${NC}"
    echo "✅ Firebase initialized successfully"
    echo "✅ Current notification permission: granted"
    echo "✅ Existing token found: ..."
    echo "✅ Token registered with backend! Device ID: ..."
    echo "✅ Current device found in backend registry"
}

# Main test execution
main() {
    echo "Starting comprehensive device and notification tests..."
    
    # Run tests
    test_backend_connection || exit 1
    
    device_found=false
    check_registered_devices && device_found=true
    
    if [ "$device_found" = false ]; then
        echo -e "\n${YELLOW}No devices found. Registering a test device...${NC}"
        register_test_device
        echo -e "\n${BLUE}Checking devices again after registration:${NC}"
        check_registered_devices
    fi
    
    test_notification_sending
    get_system_stats
    run_web_client_test
    
    echo -e "\n${GREEN}🎉 Test completed!${NC}"
    echo -e "\n${BLUE}Summary:${NC}"
    echo "• If notification sending failed with 'No devices available':"
    echo "  - Register a real device using the web client"
    echo "  - Check that tokens are long enough (150+ characters)"
    echo "  - Verify CORS is working (no console errors)"
    echo ""
    echo "• If web client shows errors:"
    echo "  - Check browser console for specific error messages"
    echo "  - Ensure Firebase config is correct in config.js"
    echo "  - Verify service worker is loading properly"
}

# Run the main function
main

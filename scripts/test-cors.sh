#!/bin/bash

# CORS Test Script
# Tests if the backend accepts requests from different localhost ports

API_BASE="http://localhost:3000/api"

echo "🧪 Testing CORS configuration..."
echo "================================="

# Test different localhost origins
ORIGINS=(
    "http://localhost:8080"
    "http://localhost:3000" 
    "http://localhost:50917"
    "http://localhost:5000"
    "http://localhost:4000"
)

echo ""
echo "Testing GET requests from different origins:"

for origin in "${ORIGINS[@]}"; do
    echo -n "Testing from $origin: "
    
    response=$(curl -s -H "Origin: $origin" \
        -w "%{http_code}" \
        -o /dev/null \
        "$API_BASE/devices/tokens")
    
    if [ "$response" = "200" ]; then
        echo "✅ SUCCESS"
    else
        echo "❌ FAILED (HTTP $response)"
    fi
done

echo ""
echo "Testing POST requests (with preflight):"

for origin in "${ORIGINS[@]}"; do
    echo -n "Testing preflight from $origin: "
    
    # Test OPTIONS request (preflight)
    response=$(curl -s -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        -w "%{http_code}" \
        -o /dev/null \
        "$API_BASE/notifications/send")
    
    if [ "$response" = "200" ] || [ "$response" = "204" ]; then
        echo "✅ SUCCESS"
    else
        echo "❌ FAILED (HTTP $response)"
    fi
done

echo ""
echo "✅ CORS test completed!"
echo "💡 All localhost origins should be allowed in development mode."

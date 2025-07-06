#!/bin/bash

# Start both backend and client in development mode

echo "🚀 Starting Push Notification MVP in development mode..."

# Check if both directories exist
if [ ! -d "backend" ] || [ ! -d "client" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start client server
echo "🌐 Starting client server..."
cd ../client
npm start &
CLIENT_PID=$!

echo ""
echo "✅ Servers started!"
echo "🔧 Backend: http://localhost:3000"
echo "🌐 Client: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait $BACKEND_PID
wait $CLIENT_PID

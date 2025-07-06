#!/bin/bash

# Push Notification MVP Setup Script

echo "🚀 Setting up Push Notification MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/data
mkdir -p client/public/icons

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install

# Create placeholder icon files (you should replace these with real icons)
echo "🎨 Creating placeholder icons..."
cd public

# Create a simple SVG icon and convert it to different sizes
# For a real implementation, you'd want proper PNG icons
cat > icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#4f46e5" rx="32"/>
  <circle cx="96" cy="96" r="40" fill="white"/>
  <text x="96" y="105" text-anchor="middle" fill="#4f46e5" font-family="Arial" font-size="24" font-weight="bold">🔔</text>
</svg>
EOF

# For the MVP, we'll create simple colored rectangles as placeholders
# In a real app, you'd use proper icon files
echo "Creating placeholder icon files (replace with real icons for production)..."

# Create 192x192 icon placeholder
cat > icon-192x192.png.txt << 'EOF'
This should be a 192x192 PNG icon file.
For the MVP, please replace this with an actual icon file.
You can use tools like GIMP, Photoshop, or online converters.
EOF

# Create 512x512 icon placeholder
cat > icon-512x512.png.txt << 'EOF'
This should be a 512x512 PNG icon file.
For the MVP, please replace this with an actual icon file.
You can use tools like GIMP, Photoshop, or online converters.
EOF

cd ../..

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your Firebase credentials"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up a Firebase project at https://console.firebase.google.com/"
echo "2. Edit backend/.env with your Firebase credentials"
echo "3. Edit client/public/config.js with your Firebase web app config"
echo "4. Replace placeholder icon files with real PNG icons"
echo "5. Run ./scripts/start-dev.sh to start the application"
echo ""
echo "📖 See SETUP.md for detailed instructions"

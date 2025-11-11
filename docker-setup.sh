#!/bin/bash

echo "🐳 Setting up Docker environment for Discord Bots Management..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data public/uploads

# Adjust permissions to allow writing by the container
# The container entrypoint will adjust final permissions, but we ensure they exist
echo "🔐 Adjusting permissions..."
chmod -R 777 public/uploads
chmod -R 777 data

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found!"
    echo ""
    read -p "Do you want to create a .env file with default values? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

# Authentication credentials
AUTH_USERNAME=admin
AUTH_PASSWORD=YourSecurePassword123!
AUTH_SECRET=your-very-secure-32-character-key
EOF
        echo "✅ .env file created!"
        echo ""
        echo "⚠️  IMPORTANT: Edit the .env file and change the passwords before using in production!"
    else
        echo ""
        echo "❌ Configure the .env file before continuing."
        echo "   Copy the env.example file: cp env.example .env"
        exit 1
    fi
fi

echo ""
echo "✅ Setup completed!"
echo ""
echo "🚀 To start the application:"
echo "   docker-compose up -d"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🌐 Access: http://localhost:3000"
echo ""

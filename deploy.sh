#!/bin/bash

# Deployment script for Daily Team Whisper
set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Please update .env file with your actual values before deploying!"
        exit 1
    else
        print_error ".env.example file not found. Please create environment configuration."
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version check passed: $(node --version)"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Run security audit
print_status "Running security audit..."
npm audit --audit-level moderate || {
    print_warning "Security vulnerabilities found. Consider running 'npm audit fix'"
}

# Run type checking
print_status "Running type checking..."
npm run check || {
    print_error "Type checking failed. Please fix TypeScript errors."
    exit 1
}

# Build the application
print_status "Building application..."
npm run build || {
    print_error "Build failed. Please check build errors."
    exit 1
}

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build directory not found. Build may have failed."
    exit 1
fi

print_status "Build completed successfully!"

# Run build verification
print_status "Verifying build..."
if [ -f "check-build.js" ]; then
    npm run check-build || {
        print_error "Build verification failed."
        exit 1
    }
fi

# Database migration (if needed)
if [ -f "drizzle.config.ts" ]; then
    print_status "Running database migrations..."
    npm run db:push || {
        print_warning "Database migration failed. Please check database connection."
    }
fi

# Create deployment info
cat > dist/deployment-info.json << EOF
{
    "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "$(npm pkg get version | tr -d '"')",
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)",
    "environment": "${NODE_ENV:-production}",
    "buildHash": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

print_status "Deployment info created."

# Platform-specific deployment
case "${DEPLOY_PLATFORM:-}" in
    "render")
        print_status "Deploying to Render..."
        # Render deployment is handled by render.yaml
        ;;
    "vercel")
        print_status "Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            print_warning "Vercel CLI not found. Please install with: npm i -g vercel"
        fi
        ;;
    "docker")
        print_status "Building Docker image..."
        docker build -t daily-team-whisper:latest .
        print_status "Docker image built successfully!"
        ;;
    "heroku")
        print_status "Deploying to Heroku..."
        if command -v heroku &> /dev/null; then
            git add .
            git commit -m "Deploy $(date)" || true
            git push heroku main
        else
            print_warning "Heroku CLI not found. Please install Heroku CLI."
        fi
        ;;
    *)
        print_status "Generic deployment preparation completed."
        print_status "Application is ready for deployment!"
        ;;
esac

print_status "✅ Deployment process completed successfully!"
print_status "📁 Build files are in: ./dist"
print_status "🏥 Health check endpoint: /health"
print_status "📊 Deployment info: /deployment-info.json"

# Display next steps
echo ""
echo "🎯 Next Steps:"
echo "1. Verify all environment variables are set correctly"
echo "2. Test the application locally: npm start"
echo "3. Deploy to your chosen platform"
echo "4. Monitor application health after deployment"
echo ""
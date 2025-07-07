#!/bin/bash

# EngageSphere Vercel Deployment Script
echo "🚀 Starting Vercel deployment for EngageSphere..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your app should be live at the URL provided above"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Create admin account using the API"
echo "3. Test all features (chat, video calls, file uploads)"
echo "4. Set up custom domain if needed"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT.md" 
@echo off
echo 🚀 Starting Vercel deployment for EngageSphere...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI is not installed. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please log in to Vercel...
    vercel login
)

REM Build the frontend
echo 📦 Building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo ✅ Deployment completed!
echo 🌐 Your app should be live at the URL provided above
echo.
echo 📋 Next steps:
echo 1. Set up environment variables in Vercel dashboard
echo 2. Create admin account using the API
echo 3. Test all features (chat, video calls, file uploads)
echo 4. Set up custom domain if needed
echo.
echo 📖 For detailed instructions, see VERCEL_DEPLOYMENT.md
pause 
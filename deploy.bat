@echo off
echo 🚀 Starting EngageSphere Deployment Process...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm run install:all

echo 🔨 Building frontend...
call npm run build:frontend

echo 🔧 Building backend...
call npm run build:backend

echo ✅ Build completed successfully!
echo.
echo 🌐 Deployment Instructions:
echo 1. Push this branch to GitHub:
echo    git add . ^&^& git commit -m "Prepare for Render deployment" ^&^& git push origin NewVersion
echo.
echo 2. Go to Render.com and create a new Web Service
echo 3. Connect your GitHub repository
echo 4. Select the 'NewVersion' branch
echo 5. Use these settings:
echo    - Build Command: npm run render-build
echo    - Start Command: npm run render-start
echo 6. Add your environment variables in Render dashboard
echo.
echo 🎯 Your app will be available at: https://your-app-name.onrender.com
pause 
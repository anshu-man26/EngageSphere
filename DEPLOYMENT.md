# 🚀 EngageSphere Deployment Guide

This guide will help you deploy EngageSphere to Render.com with a single command build system.

## 📋 Prerequisites

Before deploying, make sure you have:

1. **GitHub Repository**: Your code pushed to GitHub
2. **Render.com Account**: Sign up at [render.com](https://render.com)
3. **External Services Setup**:
   - MongoDB Atlas database
   - Cloudinary account
   - Agora.io account
   - Gmail account (for email service)

## 🔧 Quick Deployment

### Option 1: Using Deployment Scripts

**For Windows:**
```bash
deploy.bat
```

**For Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin NewVersion
   ```

## 🌐 Render.com Setup

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `NewVersion` branch

### Step 2: Configure Build Settings

**Service Name:** `engagesphere` (or your preferred name)

**Build Command:**
```bash
npm run render-build
```

**Start Command:**
```bash
npm run render-start
```

**Environment:** `Node`

**Plan:** `Free` (or your preferred plan)

### Step 3: Environment Variables

Add these environment variables in the Render dashboard:

#### Required Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

#### Email Configuration:
```
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

#### Cloudinary Configuration:
```
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
```

#### Agora Configuration:
```
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

#### Frontend URL:
```
CLIENT_URL=https://your-frontend-service-name.onrender.com
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for the build to complete (usually 5-10 minutes)
3. Your app will be available at: `https://your-service-name.onrender.com`

## 🔄 Automatic Deployments

Once set up, Render will automatically deploy when you push to the `NewVersion` branch.

## 🛠️ Build Commands Explained

### `npm run install:all`
Installs dependencies for root, backend, and frontend projects.

### `npm run build:frontend`
- Installs frontend dependencies
- Builds the React app for production
- Creates optimized files in `frontend/dist/`

### `npm run build:backend`
- Installs backend dependencies
- Prepares the Node.js server for production

### `npm run render-build`
Combines frontend and backend builds for Render deployment.

### `npm run render-start`
Starts the production server.

## 📁 Project Structure After Build

```
EngageSphere/
├── frontend/
│   ├── dist/           # Production build files
│   └── ...
├── backend/
│   ├── node_modules/   # Backend dependencies
│   └── ...
└── ...
```

## 🔍 Troubleshooting

### Build Failures

1. **Check Node.js version**: Ensure you're using Node.js 16+ 
2. **Check environment variables**: All required variables must be set
3. **Check dependencies**: Ensure all packages are properly installed

### Runtime Errors

1. **Database connection**: Verify MongoDB URI is correct
2. **External services**: Check Cloudinary and Agora credentials
3. **CORS issues**: Verify CLIENT_URL is set correctly

### Common Issues

**"Module not found" errors:**
- Run `npm run install:all` to ensure all dependencies are installed

**"Port already in use":**
- Render automatically assigns ports, no action needed

**"Build timeout":**
- Free tier has 15-minute build limit
- Consider upgrading to paid plan for larger builds

## 📞 Support

If you encounter issues:

1. Check the Render build logs
2. Verify all environment variables are set
3. Ensure your external services are properly configured
4. Check the [Render documentation](https://render.com/docs)

## 🎯 Next Steps

After successful deployment:

1. Test all features (signup, login, messaging, video calls)
2. Set up custom domain (optional)
3. Configure monitoring and alerts
4. Set up automatic backups for your database

---

**Happy Deploying! 🚀** 
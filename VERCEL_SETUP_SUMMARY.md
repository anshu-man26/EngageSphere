# Vercel Deployment Setup Summary

This document summarizes all the changes made to prepare EngageSphere for Vercel deployment.

## 📁 New Files Created

### 1. `vercel.json`
- **Purpose**: Main Vercel configuration file
- **Features**:
  - Configures builds for both frontend and backend
  - Sets up routing for API endpoints (`/api/*`) and Socket.IO (`/socket.io/*`)
  - Routes all other requests to the frontend static files
  - Sets production environment variables
  - Configures serverless function timeout (30 seconds)

### 2. `api/index.js`
- **Purpose**: Entry point for Vercel serverless functions
- **Features**: Exports the Express app for serverless execution

### 3. `.vercelignore`
- **Purpose**: Excludes unnecessary files from deployment
- **Excludes**: node_modules, build artifacts, environment files, logs, etc.

### 4. `VERCEL_DEPLOYMENT.md`
- **Purpose**: Comprehensive deployment guide
- **Includes**: Step-by-step instructions, environment variables, troubleshooting

### 5. `deploy-vercel.sh` & `deploy-vercel.bat`
- **Purpose**: Automated deployment scripts
- **Features**: Install Vercel CLI, build frontend, deploy to production

## 🔧 Modified Files

### 1. `package.json` (Root)
- **Added Scripts**:
  - `vercel-build`: Builds frontend for Vercel
  - `vercel-dev`: Development command for Vercel

### 2. `frontend/vite.config.js`
- **Added**: `base: "/"` for proper asset paths
- **Enhanced Build Configuration**:
  - Optimized output directory
  - Code splitting for better performance
  - Manual chunks for vendor, UI, chat, and media libraries

### 3. `backend/server.js`
- **CORS Updates**: Added Vercel domains to allowed origins
- **Vercel Compatibility**: Added conditional export for serverless functions
- **Environment Detection**: Handles both traditional server and Vercel environments

### 4. `backend/socket/socket.js`
- **CORS Updates**: Added Vercel domains to Socket.IO CORS configuration

### 5. `frontend/src/context/SocketContext.jsx`
- **URL Detection**: Automatically detects backend URL based on environment
- **Production Ready**: Uses same domain for production, localhost for development

## 🌐 Environment Variables Required

The following environment variables must be set in Vercel dashboard:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Agora (Video Calls)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Admin Account
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
ADMIN_EMAIL=your_admin_email
```

## 🚀 Deployment Process

### Quick Deploy
1. **Using Scripts**:
   ```bash
   # Linux/Mac
   chmod +x deploy-vercel.sh
   ./deploy-vercel.sh
   
   # Windows
   deploy-vercel.bat
   ```

2. **Manual Deploy**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

### Vercel Dashboard Deploy
1. Connect Git repository to Vercel
2. Configure build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm run install:all`
3. Set environment variables
4. Deploy

## 🔄 How It Works

### Architecture
- **Frontend**: Built as static files served by Vercel
- **Backend**: Runs as serverless functions
- **WebSocket**: Handled through Socket.IO on serverless functions
- **Database**: External MongoDB connection
- **File Storage**: Cloudinary for images and files
- **Video Calls**: Agora SDK integration

### Routing
- `/api/*` → Backend serverless functions
- `/socket.io/*` → WebSocket connections
- `/*` → Frontend React app

### Build Process
1. Frontend builds to `frontend/dist`
2. Backend code is packaged for serverless execution
3. Vercel serves static files and routes API calls

## ⚠️ Important Notes

### Limitations
- **Cold Starts**: Serverless functions may have cold start delays
- **WebSocket**: May have connection limits in serverless environment
- **File Uploads**: Limited to 4.5MB per request (Vercel limit)

### Best Practices
- **Environment Variables**: Never commit sensitive data
- **Database**: Use connection pooling for better performance
- **Monitoring**: Set up Vercel analytics and error tracking
- **Testing**: Test all features after deployment

### Post-Deployment
1. Create admin account using API
2. Test all features (chat, video calls, file uploads)
3. Set up custom domain if needed
4. Monitor performance and errors

## 🛠️ Troubleshooting

### Common Issues
1. **Build Failures**: Check dependencies and environment variables
2. **WebSocket Issues**: Verify CORS and Socket.IO configuration
3. **Database Connection**: Check MongoDB URI and network access
4. **File Uploads**: Verify Cloudinary credentials and file size limits

### Debug Commands
```bash
# Test API health
curl https://your-domain.vercel.app/api/health

# Check Vercel logs
vercel logs

# Test WebSocket connection
# Use browser dev tools to check Socket.IO connection
```

## 📈 Performance Optimizations

### Frontend
- Code splitting for faster initial load
- Optimized bundle sizes
- Static asset caching

### Backend
- Serverless function optimization
- Database connection pooling
- Efficient file handling

---

**Status**: ✅ Ready for Vercel deployment
**Last Updated**: Current deployment setup
**Next Steps**: Deploy and test all features 
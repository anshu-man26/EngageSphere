# 🚀 EngageSphere Deployment Guide

This guide will help you deploy EngageSphere on Render.com with all features working properly.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub repository with your code
- ✅ MongoDB Atlas account
- ✅ Cloudinary account
- ✅ Agora.io account
- ✅ Gmail account with App Password
- ✅ Render.com account

## 🔧 Step 1: External Services Setup

### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Add `0.0.0.0/0` to IP whitelist for Render access

### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard → API Keys
3. Copy your Cloud Name, API Key, and Secret Key

### Agora.io Setup
1. Sign up at [Agora.io](https://agora.io)
2. Create a new project
3. Copy your App ID and App Certificate

### Gmail SMTP Setup
1. Enable 2-factor authentication on your Gmail
2. Go to Google Account → Security → App Passwords
3. Generate an App Password for "Mail"

## 🌐 Step 2: Deploy on Render

### 2.1 Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository

### 2.2 Configure Service Settings
```
Name: engagesphere
Environment: Node
Region: Choose closest to your users
Branch: main (or your default branch)
Root Directory: (leave empty)
Build Command: npm run render-build
Start Command: npm run render-start
```

### 2.3 Set Environment Variables
Add these environment variables in the Render dashboard:

#### Required Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engagesphere?retryWrites=true&w=majority
JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters
JWT_EXPIRE=7d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
FRONTEND_URL=https://your-app-name.onrender.com
```

#### Optional Variables:
```
NODE_ENV=production
```

### 2.4 Advanced Settings
- **Auto-Deploy**: Yes
- **Health Check Path**: `/api/health`
- **Health Check Timeout**: 180 seconds

## 🔍 Step 3: Verify Deployment

### 3.1 Check Health Endpoint
Visit: `https://your-app-name.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

### 3.2 Test Frontend
Visit: `https://your-app-name.onrender.com`

Should show the EngageSphere login page.

## 👨‍💼 Step 4: Create Admin User

After successful deployment, create your first admin user:

### Method 1: Using cURL
```bash
curl -X POST https://your-app-name.onrender.com/api/admin/create-super-admin \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@yourdomain.com",
  "password": "your_secure_password",
  "fullName": "Super Admin"
}'
```

### Method 2: Using Postman
- **URL**: `https://your-app-name.onrender.com/api/admin/create-super-admin`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "email": "admin@yourdomain.com",
  "password": "your_secure_password",
  "fullName": "Super Admin"
}
```

## 🔧 Step 5: Troubleshooting

### Common Issues:

#### 1. Build Fails
**Error**: Build command fails
**Solution**: 
- Check if all dependencies are in package.json
- Verify build scripts are correct
- Check for syntax errors in code

#### 2. Environment Variables Missing
**Error**: Application crashes on startup
**Solution**:
- Verify all required environment variables are set
- Check variable names for typos
- Ensure MongoDB URI is correct

#### 3. CORS Errors
**Error**: Frontend can't connect to backend
**Solution**:
- Verify FRONTEND_URL is set correctly
- Check CORS configuration in server.js
- Ensure credentials are enabled

#### 4. Database Connection Fails
**Error**: Can't connect to MongoDB
**Solution**:
- Verify MongoDB URI is correct
- Check if IP whitelist includes Render's IPs
- Ensure database user has correct permissions

#### 5. Email Not Working
**Error**: Email notifications not sending
**Solution**:
- Verify Gmail credentials
- Check if App Password is correct
- Ensure 2FA is enabled on Gmail

### Debug Commands:

#### Check Logs
```bash
# In Render dashboard, go to your service
# Click on "Logs" tab to see real-time logs
```

#### Test Database Connection
```bash
curl https://your-app-name.onrender.com/api/health
```

#### Test Email Service
```bash
# Try signing up a new user to test email
```

## 📊 Step 6: Monitoring

### Health Monitoring
- Render automatically monitors the `/api/health` endpoint
- Service will restart if health check fails
- Check logs for any errors

### Performance Monitoring
- Monitor response times in Render dashboard
- Check MongoDB Atlas metrics
- Monitor Cloudinary usage

## 🔄 Step 7: Updates and Maintenance

### Updating the Application
1. Push changes to your GitHub repository
2. Render will automatically redeploy
3. Monitor the deployment logs
4. Test the application after deployment

### Database Backups
- MongoDB Atlas provides automatic backups
- Consider setting up manual backups for important data

### Environment Variable Updates
1. Go to Render dashboard
2. Navigate to your service
3. Go to "Environment" tab
4. Update variables as needed
5. Redeploy the service

## 🎉 Success!

Once all steps are completed, your EngageSphere application will be live at:
`https://your-app-name.onrender.com`

### Features Available:
- ✅ Real-time messaging
- ✅ Video calls
- ✅ File sharing
- ✅ Admin panel
- ✅ User management
- ✅ Email notifications
- ✅ Custom backgrounds
- ✅ Mobile optimization

### Admin Access:
- **URL**: `https://your-app-name.onrender.com/admin`
- **Email**: The email you used in step 4
- **Password**: The password you set in step 4

---

**Need Help?** Check the main README.md for more detailed information or create an issue in the repository. 
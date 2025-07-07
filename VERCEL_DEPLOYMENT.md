# Vercel Deployment Guide for EngageSphere

This guide will help you deploy your EngageSphere chat application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Your code should be in a Git repository
3. **Environment Variables**: Prepare your environment variables

## Environment Variables Setup

Before deploying, you need to set up the following environment variables in Vercel:

### Required Environment Variables

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Email Configuration (for welcome emails and notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Agora (for video calls)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Admin Account
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
ADMIN_EMAIL=your_admin_email

# Optional: Custom Domain
CUSTOM_DOMAIN=your-custom-domain.com
```

### Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with the appropriate value
5. Make sure to set them for **Production**, **Preview**, and **Development** environments

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select the repository containing your EngageSphere code

2. **Configure Project**:
   - **Framework Preset**: Select "Other" or "Node.js"
   - **Root Directory**: Leave as `/` (root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm run install:all`

3. **Environment Variables**:
   - Add all the environment variables listed above
   - Make sure to set them for all environments

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set environment variables when prompted
   - Confirm deployment settings

## Configuration Files

The following configuration files have been created for Vercel deployment:

### `vercel.json`
- Configures the build process for both frontend and backend
- Sets up routing for API endpoints and static files
- Configures serverless functions

### `api/index.js`
- Entry point for Vercel serverless functions
- Handles API routing

### Updated Files
- `backend/server.js`: Updated for Vercel compatibility
- `frontend/src/context/SocketContext.jsx`: Updated for production URLs
- `frontend/vite.config.js`: Optimized build configuration

## Post-Deployment Setup

### 1. Create Admin Account

After deployment, you need to create an admin account. You can do this by:

1. **Using the API directly**:
   ```bash
   curl -X POST https://your-vercel-domain.vercel.app/api/admin/create-admin \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "your_admin_password",
       "email": "admin@example.com"
     }'
   ```

2. **Or modify the script**:
   - Update `backend/scripts/createAdmin.js` with your admin credentials
   - Run it locally with the production database

### 2. Test the Application

1. **Frontend**: Visit your Vercel domain
2. **Backend API**: Test `/api/health` endpoint
3. **WebSocket**: Test real-time features
4. **File Upload**: Test image/file uploads
5. **Video Calls**: Test video calling functionality

### 3. Set Up Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Update DNS records as instructed
5. Update CORS settings in `backend/server.js` if needed

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are properly installed
   - Verify environment variables are set correctly
   - Check build logs in Vercel dashboard

2. **WebSocket Issues**:
   - Ensure CORS is configured correctly
   - Check that Socket.IO is working in production
   - Verify the backend URL is correct

3. **Database Connection**:
   - Verify MongoDB URI is correct
   - Check network access to your database
   - Ensure database user has proper permissions

4. **File Upload Issues**:
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS headers

### Debugging

1. **Check Vercel Logs**:
   - Go to your project dashboard
   - Click on "Functions" tab
   - View logs for serverless functions

2. **Test API Endpoints**:
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

3. **Check Environment Variables**:
   - Verify all variables are set in Vercel dashboard
   - Check that they're available in your functions

## Performance Optimization

### Frontend
- Images are optimized during build
- Code splitting is configured
- Static assets are cached

### Backend
- Serverless functions are optimized
- Database connections are pooled
- File uploads are streamed

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Set up error monitoring
3. **Performance**: Monitor function execution times
4. **Database**: Monitor MongoDB performance

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Configure properly for production
3. **Rate Limiting**: Consider implementing rate limits
4. **HTTPS**: Vercel provides SSL by default
5. **Database**: Use connection string with authentication

## Support

If you encounter issues:

1. Check Vercel documentation
2. Review build logs
3. Test locally with production environment variables
4. Check MongoDB and other service status

## Updates and Maintenance

To update your deployment:

1. Push changes to your Git repository
2. Vercel will automatically redeploy
3. Monitor the deployment process
4. Test the updated application

---

**Note**: This deployment configuration is optimized for Vercel's serverless platform. The backend runs as serverless functions, which may have cold start times but provide excellent scalability. 
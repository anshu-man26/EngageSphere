# EngageSphere 💬

A modern, feature-rich real-time chat application built with React, Node.js, and Socket.IO. EngageSphere offers a seamless messaging experience with video calls, file sharing, custom backgrounds, admin panel, and advanced security features.

## 🌐 Live Demo

**Try the application live:** [https://engagesphere-mrjv.onrender.com/](https://engagesphere-mrjv.onrender.com/)

*Experience real-time messaging, video calls, file sharing, and more!*

![EngageSphere](https://img.shields.io/badge/EngageSphere-Chat%20App-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248)
![Live Demo](https://img.shields.io/badge/Live%20Demo-EngageSphere-green?style=for-the-badge&logo=render)

## ✨ Features

### 🔐 Authentication & Security
- **Login with Email or Username**: Users can sign in using either their email address or username
- **Email Verification**: OTP-based email verification during signup
- **Two-Factor Authentication (2FA)**: Enhanced security with email OTP
- **Password Reset**: Secure password reset via email OTP
- **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- **Account Deletion**: Secure account deletion with OTP verification
- **Admin Authentication**: Separate admin login with enhanced security

### 💬 Real-Time Messaging
- **Instant Messaging**: Real-time text messages with Socket.IO
- **Message Reactions**: React to messages with emojis (long-press on mobile)
- **Message Status**: WhatsApp-style delivery and read receipts (single tick, double tick, blue tick)
- **Message Deletion**: Delete messages for yourself or everyone
- **Bulk Message Operations**: Select and delete multiple messages
- **Typing Indicators**: See when someone is typing
- **Online Status**: Real-time online/offline status with 2-minute inactivity timeout
- **Message Timestamps**: Precise message timing
- **Offline Notifications**: Email notifications when users are offline (5-minute cooldown)
- **Unread Message Badges**: Red notification badges for unread messages
- **Sound Settings**: Toggle message sounds and video call ringtones

### 📹 Video Calling
- **HD Video Calls**: High-quality video calls powered by Agora RTC
- **Audio Controls**: Mute/unmute functionality
- **Video Controls**: Turn camera on/off
- **Call Notifications**: Incoming call alerts with customizable ringtones
- **Call Management**: Accept, reject, or end calls
- **Cross-platform**: Works on desktop and mobile browsers
- **Sound Controls**: Toggle ringtone sounds in settings

### 📁 File Sharing
- **Image Sharing**: Share photos and images (JPG, PNG, GIF, WebP)
- **Document Sharing**: Share PDFs, Word documents, and text files
- **File Preview**: Preview images directly in chat
- **File Downloads**: Download shared files
- **Cloud Storage**: Files stored securely on Cloudinary
- **File Size Limits**: Up to 10MB per file

### 🎨 Customization
- **Chat Backgrounds**: Custom background images for conversations
- **Default Backgrounds**: Set default chat backgrounds
- **Background Management**: Upload, preview, and manage background images
- **Profile Pictures**: Upload and manage profile pictures
- **Dark Theme**: Eye-friendly dark interface design
- **Modern UI**: Glass morphism effects and smooth animations

### 👨‍💼 Admin Panel
- **Admin Dashboard**: Comprehensive admin interface
- **User Management**: View, search, and manage all users
- **Real-time Stats**: Live user statistics and online user count
- **Secure User Deletion**: Multi-step deletion with OTP verification
- **Admin Profile Management**: Change admin password and email
- **Password Recovery**: Admin password reset via OTP
- **Online User Tracking**: Real-time online user monitoring
- **Bulk Operations**: Delete multiple users with confirmation

### 🔍 User Management
- **User Search**: Search for users by name or username
- **User Profiles**: View detailed user profiles
- **Profile Editing**: Update personal information
- **Username Changes**: Change username with validation
- **Email Changes**: Update email with verification
- **Password Changes**: Secure password updates
- **Sound Preferences**: Customize notification sounds

### 📱 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Beautiful page transitions and animations
- **Loading States**: Skeleton loaders and progress indicators
- **Toast Notifications**: User-friendly notifications
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: Keyboard navigation and screen reader support
- **Mobile Optimized**: Touch-friendly interface with modern circular sidebar button
- **Emoji Picker**: Mobile-optimized emoji selector with scrolling

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **Socket.IO Client** - Real-time communication
- **React Router DOM** - Client-side routing
- **Zustand** - State management
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon library
- **Agora RTC SDK** - Video calling
- **Emoji Picker React** - Emoji reactions

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud image and file storage
- **Nodemailer** - Email sending
- **CORS** - Cross-origin resource sharing
- **Cookie Parser** - HTTP-only cookie handling

### External Services
- **Agora.io** - Video calling infrastructure
- **Cloudinary** - Cloud file storage and image processing
- **MongoDB Atlas** - Cloud database (recommended)
- **Gmail SMTP** - Email delivery service

## 🚀 Deployment on Render

### Prerequisites
- Render.com account
- MongoDB Atlas database
- Cloudinary account
- Agora.io account
- Gmail account with App Password

### Step 1: Prepare Your Repository
1. Ensure your code is pushed to GitHub
2. Make sure all environment variables are properly configured
3. Verify the build scripts work locally

### Step 2: Set Up MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

### Step 3: Set Up External Services

**Cloudinary:**
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and secret key

**Agora.io:**
1. Sign up at [agora.io](https://agora.io)
2. Create a new project
3. Get your App ID and App Certificate

**Gmail SMTP:**
1. Enable 2-factor authentication on your Gmail
2. Generate an App Password

### Step 4: Deploy on Render

1. **Create a new Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the Service**
   ```
   Name: engagesphere
   Environment: Node
   Build Command: npm run render-build
   Start Command: npm run render-start
   ```

3. **Set Environment Variables**
   Add these environment variables in Render dashboard:

   **Required Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_very_long_random_secret_key
   JWT_EXPIRE=7d
   
   # Email Configuration
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   
   # Cloudinary Configuration
   CLOUDINARY_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
   
   # Agora Configuration
   AGORA_APP_ID=your_agora_app_id
   AGORA_APP_CERTIFICATE=your_agora_app_certificate
   
   # Frontend URL (for CORS)
   FRONTEND_URL=https://your-app-name.onrender.com
   ```

4. **Advanced Settings**
   - **Auto-Deploy**: Yes
   - **Branch**: main (or your default branch)
   - **Health Check Path**: `/api/health` (create this endpoint)

### Step 5: Create Health Check Endpoint

Add this to your backend `server.js`:

```javascript
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Step 6: Update CORS Configuration

Update your backend CORS settings:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));
```

### Step 7: Create Admin User

After deployment, create your first admin user:

1. Access your deployed backend URL
2. Run the admin creation script:
   ```bash
   curl -X POST https://your-app-name.onrender.com/api/admin/create-super-admin \
   -H "Content-Type: application/json" \
   -d '{
     "email": "admin@yourdomain.com",
     "password": "your_secure_password",
     "fullName": "Super Admin"
   }'
   ```

## 🚀 Local Development

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/engagesphere.git
   cd engagesphere
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   Create `.env` files in both `backend/` and `frontend/` directories:

   **Backend (.env)**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   
   # Email Configuration (Gmail recommended)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Cloudinary Configuration
   CLOUDINARY_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
   
   # Agora Configuration
   AGORA_APP_ID=your_agora_app_id
   AGORA_APP_CERTIFICATE=your_agora_app_certificate
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_AGORA_APP_ID=your_agora_app_id
   ```

4. **Run the Application**

   **Development Mode:**
   ```bash
   # From root directory
   npm run dev
   ```

   **Production Build:**
   ```bash
   # Build frontend
   npm run build:frontend
   
   # Start backend
   npm run start
   ```

### Login Instructions
- You can login using either your **email address** or your **username** along with your password.

## 📱 Mobile Features

- **Touch-Optimized**: All interactions work smoothly on mobile devices
- **Modern Sidebar**: Circular sidebar button with smooth animations
- **Emoji Picker**: Mobile-optimized emoji selector with scrolling
- **Responsive Design**: Adapts to all screen sizes
- **Touch Gestures**: Long-press for reactions, swipe for actions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | JWT expiration time | No (default: 7d) |
| `EMAIL_USER` | Gmail address | Yes |
| `EMAIL_PASS` | Gmail app password | Yes |
| `CLOUDINARY_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_SECRET_KEY` | Cloudinary secret key | Yes |
| `AGORA_APP_ID` | Agora App ID | Yes |
| `AGORA_APP_CERTIFICATE` | Agora App Certificate | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

### Build Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development servers |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run render-build` | Build for Render deployment |
| `npm run render-start` | Start for Render deployment |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Agora.io](https://agora.io) for video calling infrastructure
- [Cloudinary](https://cloudinary.com) for file storage
- [Socket.IO](https://socket.io) for real-time communication
- [Tailwind CSS](https://tailwindcss.com) for styling
- [React](https://reactjs.org) for the frontend framework

Made By Anshuman Singh

# EngageSphere 💬

A modern, feature-rich real-time chat application built with React, Node.js, and Socket.IO. EngageSphere offers a seamless messaging experience with video calls, file sharing, custom backgrounds, and advanced security features.

![EngageSphere](https://img.shields.io/badge/EngageSphere-Chat%20App-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248)

## ✨ Features

### 🔐 Authentication & Security
- **Email Verification**: OTP-based email verification during signup
- **Two-Factor Authentication (2FA)**: Enhanced security with email OTP
- **Password Reset**: Secure password reset via email OTP
- **JWT Authentication**: Secure token-based authentication
- **Account Deletion**: Secure account deletion with OTP verification

### 💬 Real-Time Messaging
- **Instant Messaging**: Real-time text messages with Socket.IO
- **Message Reactions**: React to messages with emojis
- **Message Deletion**: Delete messages for yourself or everyone
- **Bulk Message Operations**: Select and delete multiple messages
- **Typing Indicators**: See when someone is typing
- **Online Status**: Real-time online/offline status
- **Message Timestamps**: Precise message timing

### 📹 Video Calling
- **HD Video Calls**: High-quality video calls powered by Agora RTC
- **Audio Controls**: Mute/unmute functionality
- **Video Controls**: Turn camera on/off
- **Call Notifications**: Incoming call alerts with ringtones
- **Call Management**: Accept, reject, or end calls
- **Cross-platform**: Works on desktop and mobile browsers

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

### 🔍 User Management
- **User Search**: Search for users by name or username
- **User Profiles**: View detailed user profiles
- **Profile Editing**: Update personal information
- **Username Changes**: Change username with validation
- **Email Changes**: Update email with verification
- **Password Changes**: Secure password updates

### 📱 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Beautiful page transitions and animations
- **Loading States**: Skeleton loaders and progress indicators
- **Toast Notifications**: User-friendly notifications
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: Keyboard navigation and screen reader support

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

### External Services
- **Agora.io** - Video calling infrastructure
- **Cloudinary** - Cloud file storage and image processing
- **MongoDB Atlas** - Cloud database (recommended)

## 🚀 Getting Started

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
   ```

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_AGORA_APP_ID=your_agora_app_id
   ```

4. **Database Setup**
   - Set up a MongoDB database (local or MongoDB Atlas)
   - Update the `MONGODB_URI` in your backend `.env` file

5. **External Services Setup**

   **Cloudinary:**
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Get your cloud name, API key, and secret key
   - Update the Cloudinary credentials in your backend `.env`

   **Agora.io:**
   - Sign up at [agora.io](https://agora.io)
   - Create a new project and get your App ID
   - Update the Agora credentials in your `.env` files

   **Email Service (Gmail):**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password
   - Update the email credentials in your backend `.env`

6. **Run the Application**

   **Development Mode:**
   ```bash
   # Terminal 1 - Start backend
   cd backend
   npm run dev
   
   # Terminal 2 - Start frontend
   cd frontend
   npm run dev
   ```

   **Production Mode:**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Start backend
   cd ../backend
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📖 Usage Guide

### Creating an Account
1. Navigate to the signup page
2. Enter your full name, email, and password
3. Verify your email with the OTP sent to your inbox
4. Complete your profile with gender selection
5. Start chatting!

### Starting a Conversation
1. Use the search bar to find users
2. Click on a user to start a conversation
3. Send messages, files, or start a video call

### Video Calling
1. Click the video call button in any conversation
2. Allow camera and microphone permissions
3. Wait for the other person to answer
4. Use the controls to mute/unmute or turn video on/off

### Customizing Your Experience
1. Go to your profile settings
2. Upload a profile picture
3. Set custom chat backgrounds
4. Manage your uploaded background images

### Security Features
1. Enable 2FA in your profile settings
2. Use strong passwords
3. Keep your email verified
4. Regularly update your security settings

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/send-signup-otp` - Send signup OTP
- `POST /api/auth/verify-signup-otp` - Verify signup OTP
- `POST /api/auth/send-otp` - Send password reset OTP
- `POST /api/auth/verify-otp` - Verify password reset OTP
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile/:username` - Get user profile
- `PUT /api/users/profile/update` - Update profile
- `POST /api/users/profile/upload-pic` - Upload profile picture
- `PUT /api/users/change-username` - Change username
- `PUT /api/users/change-email` - Change email
- `PUT /api/users/change-password` - Change password
- `POST /api/users/upload-background` - Upload chat background
- `PUT /api/users/default-background` - Update default background
- `DELETE /api/users/delete-account` - Delete account

### Messages
- `GET /api/messages/:id` - Get conversation messages
- `POST /api/messages/send/:id` - Send message
- `POST /api/messages/upload/:id` - Upload file
- `DELETE /api/messages/:id` - Delete message
- `DELETE /api/messages/bulk` - Delete multiple messages

### Conversations
- `GET /api/conversations` - Get user conversations
- `PUT /api/conversations/:id/background` - Update chat background

## 🏗️ Project Structure

```
EngageSphere/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── nodemailer.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── fileUpload.controller.js
│   │   ├── message.controller.js
│   │   └── user.controller.js
│   ├── db/
│   │   └── connectToMongoDB.js
│   ├── middleware/
│   │   ├── protectRoute.js
│   │   └── upload.js
│   ├── models/
│   │   ├── conversation.model.js
│   │   ├── message.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── message.routes.js
│   │   └── user.routes.js
│   ├── socket/
│   │   └── socket.js
│   ├── utils/
│   │   └── generateToken.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── chat-background/
│   │   │   ├── messages/
│   │   │   ├── sidebar/
│   │   │   └── skeletons/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── VideoCallContext.jsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── zustand/
│   ├── public/
│   └── index.html
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Agora.io](https://agora.io) for video calling infrastructure
- [Cloudinary](https://cloudinary.com) for file storage and image processing
- [Socket.IO](https://socket.io) for real-time communication
- [Tailwind CSS](https://tailwindcss.com) for styling
- [React](https://reactjs.org) for the frontend framework

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/yourusername/engagesphere/issues) page
2. Create a new issue if your problem isn't already addressed
3. Contact the maintainers

---

**Made with ❤️ by [Your Name]**

*EngageSphere - Connect, Communicate, Collaborate* 
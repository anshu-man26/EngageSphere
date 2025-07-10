# EngageSphere 💬

A modern real-time chat application built with React, Node.js, and Socket.IO.

## 🌐 Live Demo

**Deployed on Render:** [https://engagesphere-mrjv.onrender.com/](https://engagesphere-mrjv.onrender.com/)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Cloudinary account
- Agora.io account
- Gmail account with App Password

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
   AGORA_APP_ID=your_agora_app_id
   AGORA_APP_CERTIFICATE=your_agora_certificate
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:5173
   ```

## 🛠️ Build for Production

### Backend
```bash
cd backend
npm run build
```

### Frontend
```bash
cd frontend
npm run build
```

## 🚀 Deployment

### Render.com Deployment

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Configure build settings:**
   - Build Command: `npm run render-build`
   - Start Command: `npm run render-start`
4. **Set all environment variables in Render dashboard**
5. **Deploy**

### Environment Variables for Production

Set these in your deployment platform:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_very_long_random_secret_key
JWT_EXPIRE=7d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate
```

## 📱 Mobile Access

For mobile testing, use your local IP address:
```
http://your_local_ip:5000
```

## 🔧 Troubleshooting

- **Port conflicts:** Change PORT in .env file
- **CORS issues:** Update CORS origins in backend/server.js
- **Socket connection fails:** Ensure backend is running on correct port
- **File upload issues:** Verify Cloudinary credentials 
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { VideoCallProvider } from "./context/VideoCallContext.jsx";

// Suppress unwanted console messages
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Convert all arguments to strings for easier filtering
  const message = args.map(arg => String(arg)).join(' ');
  
  // Suppress React DevTools message
  if (message.includes('Download the React DevTools')) {
    return;
  }
  
  // Suppress Agora SDK debug logs
  if (message.includes('Agora-SDK') || 
      message.includes('browser ua:') || 
      message.includes('browser info:') || 
      message.includes('browser compatibility:') || 
      message.includes('device-check') || 
      message.includes('Loading global parameters') ||
      message.includes('Agora App ID:')) {
    return;
  }
  
  // Suppress socket and user status debug logs
  if (message.includes('🔌 Socket connected for user') || 
      message.includes('👥 Received online users from server') || 
      message.includes('👤 Current user ID') || 
      message.includes('👤 Is current user in online list') ||
      message.includes('🔍 User') || 
      message.includes('📊 Admin stats updated') ||
      message.includes('🔄 Requesting online users') ||
      message.includes('🔄 Manually refreshing online users') ||
      message.includes('🔌 Cleaning up admin socket listeners') ||
      message.includes('🔌 Socket disconnected for user') ||
      message.includes('🔌 Admin socket connected') ||
      message.includes('Conversation updated via socket') ||
      message.includes('🔄 System settings updated via socket')) {
    return;
  }
  
  originalConsoleLog.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthContextProvider>
				<SocketContextProvider>
					<VideoCallProvider>
						<App />
					</VideoCallProvider>
				</SocketContextProvider>
			</AuthContextProvider>
		</BrowserRouter>
	</React.StrictMode>
);

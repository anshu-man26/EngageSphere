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
  // Suppress React DevTools message
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) {
    return;
  }
  
  // Suppress Agora SDK debug logs
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('Agora-SDK') || 
       args[0].includes('browser ua:') || 
       args[0].includes('browser info:') || 
       args[0].includes('browser compatibility:') || 
       args[0].includes('device-check') || 
       args[0].includes('Loading global parameters'))) {
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

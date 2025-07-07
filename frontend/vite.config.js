import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		host: '0.0.0.0', // Allow external connections
		proxy: {
			"/api": {
				target: "http://localhost:5000",
			},
			"/socket.io": {
				target: "http://localhost:5000",
				ws: true,
			},
		},
	},
});

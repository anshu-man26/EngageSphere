import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: "/",
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
	build: {
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
					ui: ['@heroicons/react', 'lucide-react', 'react-icons'],
					chat: ['socket.io-client', 'zustand'],
					media: ['agora-rtc-sdk-ng', '@giphy/react-components']
				}
			}
		}
	}
});

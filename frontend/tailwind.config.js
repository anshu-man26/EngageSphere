/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			animation: {
				'fadeIn': 'fadeIn 0.5s ease-in-out',
				'slideUp': 'slideUp 0.6s ease-out',
				'bounce-slow': 'bounce 2s infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { 
						opacity: '0',
						transform: 'translateY(20px) scale(0.95)'
					},
					'100%': { 
						opacity: '1',
						transform: 'translateY(0) scale(1)'
					},
				},
			},
		},
	},
	// eslint-disable-next-line no-undef
	plugins: [require("daisyui")],
};

import { v2 as cloudinary } from 'cloudinary';

// Function to configure Cloudinary
const configureCloudinary = () => {
	// Validate Cloudinary configuration
	const requiredVars = ['CLOUDINARY_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_SECRET_KEY'];
	const missingVars = requiredVars.filter(varName => !process.env[varName] || process.env[varName].trim() === '');
	
	if (missingVars.length > 0) {
		console.error('Missing or empty Cloudinary environment variables:', missingVars);
		return false;
	}
	
	// Log the actual values (masked for security)
	console.log('Cloudinary configuration values:');
	console.log('CLOUDINARY_NAME:', process.env.CLOUDINARY_NAME ? `${process.env.CLOUDINARY_NAME.substring(0, 3)}...` : 'NOT SET');
	console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 5)}...` : 'NOT SET');
	console.log('CLOUDINARY_SECRET_KEY:', process.env.CLOUDINARY_SECRET_KEY ? `${process.env.CLOUDINARY_SECRET_KEY.substring(0, 5)}...` : 'NOT SET');
	
	// Configure Cloudinary
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_SECRET_KEY,
	});
	
	console.log('Cloudinary configured successfully');
	return true;
};

// Configure immediately
configureCloudinary();

export default cloudinary; 
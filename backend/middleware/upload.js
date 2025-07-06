import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Configure multer for disk storage (for profile pictures)
const diskStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
	}
});

// File filter to allow images and documents
const fileFilter = (req, file, cb) => {
	console.log("File filter checking:", file.originalname, file.mimetype);
	
	const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
	
	if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
		console.log("File accepted:", file.originalname);
		cb(null, true);
	} else {
		console.log("File rejected:", file.originalname, "Mime type:", file.mimetype);
		cb(new Error('Only image and document files are allowed!'), false);
	}
};

// Configure multer
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit for documents
	},
});

// Configure multer for profile picture uploads (disk storage)
const profilePicUpload = multer({
	storage: diskStorage,
	fileFilter: (req, file, cb) => {
		const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
		if (allowedImageTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed for profile pictures!'), false);
		}
	},
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
	},
}).single('profilePic');

export default upload;
export { profilePicUpload }; 
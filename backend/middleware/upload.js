import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();

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

export default upload; 
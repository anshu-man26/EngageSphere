import multer from "multer";
import path from "path";
import fs from "fs";

// Lambda's filesystem is read-only except /tmp. EC2 can write to ./uploads.
// Pick a writable directory based on environment so module init never crashes.
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadsDir = isLambda ? "/tmp/uploads" : "./uploads";

try {
	if (!fs.existsSync(uploadsDir)) {
		fs.mkdirSync(uploadsDir, { recursive: true });
	}
} catch (err) {
	// Don't crash module load. Disk-storage routes will fail at request
	// time if the dir really isn't writable, which is the right place to
	// surface that error.
	console.warn(`upload.js: could not ensure uploads dir at ${uploadsDir}:`, err.message);
}

// In-memory storage for general uploads (sent straight to Cloudinary).
const storage = multer.memoryStorage();

// Disk storage for profile pictures (small, single-shot).
const diskStorage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadsDir),
	filename: (_req, file, cb) => {
		const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
	},
});

// File filter — images + documents
const fileFilter = (_req, file, cb) => {
	const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
	const allowedDocTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"text/plain",
	];
	if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Only image and document files are allowed!"), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const profilePicUpload = multer({
	storage: diskStorage,
	fileFilter: (_req, file, cb) => {
		const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
		if (allowedImageTypes.includes(file.mimetype)) cb(null, true);
		else cb(new Error("Only image files are allowed for profile pictures!"), false);
	},
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("profilePic");

export default upload;
export { profilePicUpload };

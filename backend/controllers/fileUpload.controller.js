import cloudinary from "../config/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const uploadFile = async (req, res) => {
	console.log("=== FILE UPLOAD STARTED ===");
	console.log("Request params:", req.params);
	console.log("Request body:", req.body);
	console.log("Request file:", req.file ? "File present" : "No file");
	
	try {
		if (!req.file) {
			console.log("No file uploaded");
			return res.status(400).json({ error: "No file uploaded" });
		}

		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		if (!receiverId) {
			return res.status(400).json({ error: "Receiver ID is required" });
		}

		if (senderId.toString() === receiverId) {
			return res.status(400).json({ error: "Cannot send file to yourself" });
		}

		// Validate file type
		const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
		const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
		
		let fileType = 'document';
		if (allowedImageTypes.includes(req.file.mimetype)) {
			fileType = 'image';
		} else if (allowedDocTypes.includes(req.file.mimetype)) {
			fileType = 'document';
		} else {
			return res.status(400).json({ error: "File type not supported" });
		}

		// Convert buffer to base64
		const b64 = Buffer.from(req.file.buffer).toString('base64');
		const dataURI = `data:${req.file.mimetype};base64,${b64}`;

		console.log("File type detected:", fileType);
		console.log("File details:", {
			mimetype: req.file.mimetype,
			size: req.file.size,
			originalname: req.file.originalname
		});

		// Reconfigure Cloudinary to ensure credentials are loaded
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_SECRET_KEY,
		});

		// Upload to Cloudinary
		const folder = fileType === 'image' ? 'chat-images' : 'chat-documents';
		console.log("Uploading to Cloudinary folder:", folder);
		
		const result = await cloudinary.uploader.upload(dataURI, {
			folder: folder,
			resource_type: 'auto',
			format: fileType === 'image' ? 'webp' : undefined,
			quality: fileType === 'image' ? 'auto' : undefined,
		});

		console.log("Cloudinary upload successful:", result.secure_url);

		// Find or create conversation
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		// Create new message
		const newMessage = new Message({
			senderId,
			receiverId,
			message: req.body.message || "",
			messageType: fileType,
			fileUrl: result.secure_url,
			fileName: req.file.originalname,
			fileSize: req.file.size,
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// Save message and conversation
		await Promise.all([conversation.save(), newMessage.save()]);

		// Return the message with populated sender info
		const messageResponse = {
			_id: newMessage._id,
			senderId: newMessage.senderId,
			receiverId: newMessage.receiverId,
			message: newMessage.message || "", // Ensure message is never undefined
			messageType: newMessage.messageType,
			fileUrl: newMessage.fileUrl,
			fileName: newMessage.fileName,
			fileSize: newMessage.fileSize,
			createdAt: newMessage.createdAt,
			updatedAt: newMessage.updatedAt,
		};

		console.log("Message response:", messageResponse);

		// Send socket notification
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", messageResponse);
		}

		res.status(201).json(messageResponse);
		console.log("=== FILE UPLOAD COMPLETED SUCCESSFULLY ===");
	} catch (error) {
		console.error("=== FILE UPLOAD ERROR ===");
		console.error("Error message:", error.message);
		console.error("Error stack:", error.stack);
		console.error("Error name:", error.name);
		console.error("Error details:", {
			cloudinary: {
				name: process.env.CLOUDINARY_NAME ? "Set" : "Not set",
				key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
				secret: process.env.CLOUDINARY_SECRET_KEY ? "Set" : "Not set"
			}
		});
		res.status(500).json({ error: "Internal server error", details: error.message });
	}
}; 
import express from "express";
import { getMessages, sendMessage, deleteMessage, deleteMultipleMessages, addReaction, removeReaction, markMessageAsDelivered, markMessageAsRead, markMessagesAsRead } from "../controllers/msg.controller.js";
import { uploadFile } from "../controllers/fileUpload.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/upload/:id", protectRoute, upload.single('file'), uploadFile);
router.delete("/multiple", protectRoute, deleteMultipleMessages);
router.delete("/:messageId", protectRoute, deleteMessage);
router.post("/:messageId/reactions", protectRoute, addReaction);
router.delete("/:messageId/reactions", protectRoute, removeReaction);
router.put("/:messageId/delivered", protectRoute, markMessageAsDelivered);
router.put("/:messageId/read", protectRoute, markMessageAsRead);
router.put("/read/multiple", protectRoute, markMessagesAsRead);

export default router;

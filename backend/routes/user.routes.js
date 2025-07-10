import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js";
import { getUsersForSidebar, getConversations, updateUserProfile, uploadProfilePic, changePassword, changeEmail, verifyChangeEmailOtp, requestDeleteAccountOtp, deleteAccount, getUserProfile, updateChatBackground, uploadChatBackground, updateDefaultChatBackground, getUserBackgroundImages, deleteBackgroundImage, updateSoundSettings, changeUsername, updatePrivacySettings, updateProfanityFilterSettings } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.get("/conversations", protectRoute, getConversations);
router.get("/profile/:userId", protectRoute, getUserProfile);
router.put("/profile", protectRoute, updateUserProfile);
router.put("/sound-settings", protectRoute, updateSoundSettings);
router.put("/profanity-filter-settings", protectRoute, updateProfanityFilterSettings);
router.put("/privacy-settings", protectRoute, updatePrivacySettings);
router.put("/chat-background", protectRoute, updateChatBackground);
router.post("/upload-background", protectRoute, upload.single('backgroundImage'), uploadChatBackground);
router.post("/profile/upload-pic", protectRoute, upload.single('profilePic'), uploadProfilePic);
router.post("/change-password", protectRoute, changePassword);
router.post("/change-username", protectRoute, changeUsername);
router.put("/change-email", protectRoute, changeEmail);
router.post("/verify-change-email-otp", protectRoute, verifyChangeEmailOtp);
router.post("/request-delete-account-otp", protectRoute, requestDeleteAccountOtp);
router.delete("/delete-account", protectRoute, deleteAccount);
router.put("/default-chat-background", protectRoute, updateDefaultChatBackground);
router.get("/background-images", protectRoute, getUserBackgroundImages);
router.delete("/background-image", protectRoute, deleteBackgroundImage);

export default router;

import express from "express"
import { sendMessage } from "../controllers/Message.controller.js";
const router= express.Router();

router.post("/send/:id",sendMessage)

export default router;
import jwt from "jsonwebtoken";
import { authCookieOptions } from "../config/cookieOptions.js";

const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, authCookieOptions(FIFTEEN_DAYS));
};

export default generateTokenAndSetCookie;

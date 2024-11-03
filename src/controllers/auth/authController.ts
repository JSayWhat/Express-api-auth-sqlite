import { Request, Response } from "express";
import type { User } from "../../models/userTypes";
import jwt from "jsonwebtoken";
import db from "../../utils/dbConnector";
import { compareArgonPasswords } from "../../utils/cryptoHashUtils/argon2Hash";
import { encryptEmail } from "../../utils/encryptionUtils/deterministicEncryption";
import dotenv from "dotenv";

dotenv.config();
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE;
const COOKIE_SECURE = process.env.COOKIE_SECURE;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
	throw new Error(
		"ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables"
	);
}

const handleLogin = async (req: Request<User>, res: Response) => {
	try {
		const { email, password }: User = req.body;

		if (!email || !password) {
			return res
				.status(400)
				.json({ message: "Email and password are required." });
		}

		const foundUser = await getUserByEmail(email);

		if (!foundUser) {
			return res
				.status(401)
				.json({ message: "Unauthorized, no user found with this email!" });
		}

		const isPasswordValid = await compareArgonPasswords(
			password,
			foundUser.password
		);
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid password." });
		}

		const { accessToken, refreshToken } = generateTokens(foundUser);

		await updateUserTokens(foundUser.email, refreshToken, accessToken);
		await logUserSession(foundUser.userId);

		setRefreshTokenCookie(res, refreshToken);

		res.json({
			message: `User ${email} is logged in! Your role is ${foundUser.role}`,
			accessToken: accessToken,
			roles: foundUser.role,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error." });
	}
};

const getUserByEmail = (email: string): Promise<User | undefined> => {
	return new Promise((resolve, reject) => {
		const encryptedEmail = encryptEmail(email);
		const sql =
			"SELECT email, password, userId, role FROM Users WHERE email = ?";
		db.get(sql, [encryptedEmail], (err: Error | null, row: User) => {
			if (err) {
				console.error("Error fetching user by email:", err.message);
				reject(err);
			} else {
				resolve(row);
			}
		});
	});
};

const generateTokens = (user: User) => {
	// Access Token payload
	const accessTokenPayload = {
		email: user.email,
		userId: user.userId,
		role: user.role,
	};

	// Refresh Token payload
	const refreshTokenPayload = {
		userId: user.userId,
	};

	const accessToken = jwt.sign(accessTokenPayload, ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m",
	});
	const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "1d",
	});

	return { accessToken, refreshToken };
};

const updateUserTokens = (
	email: string,
	refreshToken: string,
	accessToken: string
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const updateSql =
			"UPDATE Users SET refreshToken = ?, accessToken = ?, lastLoginAt = CURRENT_TIMESTAMP WHERE email = ?";
		db.run(
			updateSql,
			[refreshToken, accessToken, email],
			(err: Error | null) => {
				if (err) reject(err);
				else resolve();
			}
		);
	});
};

const logUserSession = (userId: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const insertSessionSql = "INSERT INTO Session (userId) VALUES (?)";
		db.run(insertSessionSql, [userId], function (err: Error | null) {
			if (err) reject(err);
			else {
				console.log("Session started with sessionId:", this.lastID);
				resolve();
			}
		});
	});
};

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
	res.cookie("jwt", refreshToken, {
		httpOnly: COOKIE_SECURE === "true",
		secure: process.env.NODE_ENV === "PRODUCTION",
		sameSite: COOKIE_SAME_SITE as "strict" | "lax" | "none",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		path: "/", // cookie is valid for all routes
	});
};

export default handleLogin;

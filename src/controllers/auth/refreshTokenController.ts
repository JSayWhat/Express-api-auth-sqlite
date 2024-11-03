import { Request, Response } from "express";
import type { User } from "../../models/userTypes";
import jwt, { Secret, JwtPayload, VerifyErrors } from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../../utils/dbConnector";

dotenv.config();
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE;
const ACCESS_TOKEN_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET || "";
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET || "";

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
	throw new Error(
		"ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables"
	);
}

const findUser = async (refreshToken: string): Promise<User | null> => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM Users WHERE refreshToken = ?";
		db.get(sql, [refreshToken], (err, row: User) => {
			if (err) {
				console.error("Database error in finding User:", err);
				reject(err);
			} else {
				resolve(row || null);
			}
		});
	});
};
const updateTokens = async (
	userId: string,
	accessToken: string,
	refreshToken: string
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const sql =
			"UPDATE Users SET accessToken = ?, refreshToken = ? WHERE userId = ?";
		db.run(sql, [accessToken, refreshToken, userId], (err) => {
			if (err) {
				console.error("Database error in updating Access Token:", err);
				reject(err);
			} else {
				resolve();
			}
		});
	});
};

const invalidateOldTokens = async (userId: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const sql =
			"UPDATE Users SET accessToken = NULL, refreshToken = NULL WHERE userId = ?";
		db.run(sql, [userId], (err) => {
			if (err) {
				console.error("Database error in invalidating old tokens:", err);
				reject(err);
			} else {
				resolve();
			}
		});
	});
};

const generateTokens = (user: User) => {
	const accessTokenPayload = {
		email: user.email,
		userId: user.userId,
		role: user.role,
	};
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

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
	res.cookie("jwt", refreshToken, {
		httpOnly: process.env.COOKIE_SECURE === "true",
		secure: process.env.NODE_ENV === "PRODUCTION",
		sameSite: COOKIE_SAME_SITE as "strict" | "lax" | "none",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		path: "/", // cookie is valid for all routes
	});
};

const handleRefreshToken = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const refreshToken = req.cookies.jwt || req.headers.cookie?.split("=")[1];
		if (!refreshToken) {
			res.status(401).json({ message: "Refresh token required" });
			return;
		}

		const foundUser = await findUser(refreshToken);
		if (!foundUser) {
			res
				.status(403)
				.json({ message: "Invalid refresh token and unable to find user" });
			return;
		}

		const decoded = jwt.verify(
			refreshToken,
			REFRESH_TOKEN_SECRET
		) as JwtPayload;
		// (err: VerifyErrors | null, decoded: JwtPayload | any) => {
		if (!decoded || foundUser.userId !== decoded.userId) {
			res.status(403).json({ message: "Invalid or expired refresh token" });
			return;
		}

		await invalidateOldTokens(foundUser.userId);

		const { accessToken, refreshToken: newRefreshToken } =
			generateTokens(foundUser);

		await updateTokens(foundUser.userId, accessToken, newRefreshToken);

		setRefreshTokenCookie(res, newRefreshToken);

		res.setHeader("Authorization", `Bearer ${accessToken}`);

		res.json({
			role: foundUser.role,
			userId: foundUser.userId,
			accessToken: accessToken,
		});
	} catch (err) {
		console.error("Error in handleRefreshToken:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

export default handleRefreshToken;

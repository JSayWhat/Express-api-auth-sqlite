import { Request, Response, NextFunction } from "express";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import db from "../../utils/dbConnector";
import type { User } from "../../models/userTypes";
import { Role } from "../../models/userEnums";
import handleRefreshToken from "../../controllers/auth/refreshTokenController";
import dotenv from "dotenv";
import { updateLastActivity } from "./sessionTimeout";

dotenv.config();
const ACCESS_TOKEN_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET || "";
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET || "";
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
	throw new Error(
		"ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables"
	);
}

interface DecodedToken extends JwtPayload {
	userId: string;
	email: string;
	role: Role;
}

const findUser = async (accessToken: string): Promise<User | null> => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM Users WHERE accessToken = ?";
		db.get(sql, [accessToken], (err, row: User) => {
			if (err) {
				console.error("Database error in finding User:", err);
				reject(err);
			} else {
				resolve(row || null);
			}
		});
	});
};

const handleRefreshTokenFlow = async (
	req: Request,
	res: Response,
	next: NextFunction,
	refreshToken: string
): Promise<void> => {
	try {
		const decoded = jwt.verify(
			refreshToken,
			REFRESH_TOKEN_SECRET
		) as DecodedToken;

		const user: User = await new Promise((resolve, reject) => {
			const sql =
				"SELECT userId, email, role, refreshToken FROM users WHERE userId = ?";
			db.get(sql, [decoded.userId], (err, row: User) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		await handleRefreshToken(req, res);

		await updateLastActivity(user.userId);

		req.body.user = {
			userId: user.userId,
			email: user.email,
			role: user.role,
		};
		console.log("Refresh-User:", req.body.user);

		next();
	} catch (refreshError) {
		console.error("Error in refreshToken flow:", refreshError);
		res.status(403).json({ message: "Invalid refresh token" });
	}
};

const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;
		const accessToken = authHeader?.split(" ")[1];

		if (!accessToken) {
			return res.status(401).json({ message: "Access token is required" });
		}
		const user = await findUser(accessToken);

		if (!user) {
			const refreshToken = req.cookies.jwt || req.cookies.refreshToken;
			return handleRefreshTokenFlow(req, res, next, refreshToken);
		}
		try {
			const decoded = jwt.verify(
				accessToken,
				ACCESS_TOKEN_SECRET
			) as DecodedToken;
			req.body.user = {
				userId: decoded.userId,
				email: decoded.email,
				role: decoded.role,
			};
			console.log("JWT-User:", req.body.user);
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return res.status(401).json({ message: "Access token expired" });
			} else {
				return res.status(403).json({ message: "Invalid access token" });
			}
		}
	} catch (err) {
		console.error("Error in verifyJWT:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export default verifyJWT;

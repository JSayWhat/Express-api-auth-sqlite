import { Request, Response } from "express";
import { User } from "../../models/userTypes";
import db from "../../utils/dbConnector";
import dotenv from "dotenv";
dotenv.config();

const findUser = async (token: string): Promise<User | null> => {
	return await new Promise((resolve, reject) => {
		const sql =
			"SELECT userId FROM Users WHERE refreshToken = ? OR accessToken = ?";
		const data = db.get(
			sql,
			[token, token],
			(err: Error | null, row: User | null) => {
				if (err) {
					console.error("Database error in find user:", err);
					reject(new Error("Failed to query user by access token"));
				} else if (!row) {
					console.log("User not found in database, returned NULL");
					resolve(null);
				} else {
					resolve(row);
				}
			}
		);
	});
};
const clearTokens = async (userId: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const sql =
			"UPDATE Users SET refreshToken = NULL, accessToken = NULL WHERE userId = ?";
		db.run(sql, [userId], (err) => {
			if (err) {
				console.error("Database error in clear tokens:", err);
				reject(new Error("Failed to clear tokens"));
			} else {
				resolve();
			}
		});
	});
};

const endSession = async (userId: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const insertSessionSql =
			"UPDATE Session SET SESSION_END_TIME = CURRENT_TIMESTAMP WHERE userId = ?";
		db.run(insertSessionSql, [userId], (err) => {
			if (err) {
				console.error("Error ending session:", err);
				reject(new Error("Failed to end session"));
			} else {
				resolve();
			}
		});
		console.log("Session ended for userId:", userId);
	});
};

function clearCookie(res: Response) {
	res.clearCookie("jwt", {
		httpOnly: process.env.COOKIE_SECURE === "true",
		secure: process.env.NODE_ENV === "PRODUCTION",
		sameSite: "lax",
		path: "/", // Clear the cookie for the entire domain
	});
}

const handleLogout = async (req: Request, res: Response) => {
	try {
		const accessToken = req.header("Authorization")?.startsWith("Bearer ")
			? req.header("Authorization")?.split(" ")[1]
			: null;
		const refreshToken = req.cookies.jwt || null;
		console.log("Access Token:", accessToken ? "Present" : "Not present");
		console.log("Refresh Token:", refreshToken ? "Present" : "Not present");

		if (!refreshToken && !accessToken) {
			clearCookie(res);
			return res
				.status(200)
				.json({ message: "No token provided, logged out successfully" });
		}

		const token = refreshToken || accessToken;
		const user = await findUser(token);
		console.log("User found:", user ? "Yes" : "No");
		if (user) {
			await Promise.all([clearTokens(user.userId), endSession(user.userId)]);
		}

		clearCookie(res);

		return res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error in handleLogout:", error);
		return res.status(500).json({
			message: "Internal Server Error",
			error: (error as Error).message,
		});
	}
};

export default handleLogout;

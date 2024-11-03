import { Request, Response, NextFunction } from "express";
import db from "../../utils/dbConnector";
import verifyJWT from "./verifyJWT";

export const updateLastActivity = async (userId: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		const sql =
			"UPDATE Session SET LAST_ACTIVITY = CURRENT_TIMESTAMP WHERE userId = ?";
		db.run(sql, [userId], (err: Error | null) => {
			if (err) {
				console.error("Error updating last activity:", err);
				reject(new Error("Failed to update last activity"));
			} else {
				resolve();
			}
		});
	});
};

export const updateSessionEndTime = async (timeoutThreshold: number) => {
	const sql = `
    UPDATE Session
    SET SESSION_END_TIME = CURRENT_TIMESTAMP
    WHERE SESSION_END_TIME IS NULL
    AND (strftime('%s','now') - strftime('%s', LAST_ACTIVITY)) > ?`;

	try {
		await new Promise<void>((resolve, reject) => {
			db.run(sql, [timeoutThreshold], function (err) {
				if (err) {
					console.error("Database error in updating session end time:", err);
					reject(err);
				} else {
					console.log(`Rows updated: ${this.changes}`);
					resolve();
				}
			});
		});
	} catch (err) {
		console.error("Error in updateSessionEndTime:", err);
	}
};

const timeoutThreshold = 1800; // 30 minutes in seconds
updateSessionEndTime(timeoutThreshold);

export const sessionMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	await verifyJWT(req, res, next);
	console.log("sessionUserGlobal:", req.body.user);
	const userId: string = req.body.user?.userId;
	if (userId) {
		try {
			await updateLastActivity(userId);
		} catch (err) {
			console.error("Error updating last activity:", err);
		}
	}
};

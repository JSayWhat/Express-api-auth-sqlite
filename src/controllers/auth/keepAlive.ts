import { Request, Response, NextFunction } from "express";
import { updateLastActivity } from "../../middleware/auth/sessionTimeout";

export const sessionTimer = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const userId: string = req.body.user?.userId;
	console.log("User ID:", userId);
	if (!userId) {
		return res.status(400).json({ message: "User ID is required" });
	} else {
		try {
			await updateLastActivity(userId);
		} catch (err) {
			console.error("Error updating last activity:", err);
		}
	}
	res.status(200).json({ message: "Session updated" });
};

import { canPerformAction } from "../../controllers/roles/RBAC";
import { Action } from "../../models/userEnums";
import { Request, Response, NextFunction } from "express";
import type { User } from "../../models/userTypes";

const HTTP_STATUS_CODES = {
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
};

const ERROR_MESSAGES = {
	UNAUTHORIZED: "Not authenticated",
	FORBIDDEN: "Forbidden",
};

// Middleware for checking permissions
const checkPermissions = (action: Action) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user: User = req.body.user;

		if (!user) {
			return res
				.status(HTTP_STATUS_CODES.UNAUTHORIZED)
				.json({ message: ERROR_MESSAGES.UNAUTHORIZED });
		}
		// Allow actions on own account if action is edit_own or delete_own
		if (
			(action === Action.edit_own || Action.delete_own || Action.read_own) &&
			user.userId === req.cookies.user.userId
		) {
			return next();
		}
		// console.log("Checking permissions: ", user, action);
		if (canPerformAction(user, action)) {
			return next();
		} else {
			return res
				.status(HTTP_STATUS_CODES.FORBIDDEN)
				.json({ message: ERROR_MESSAGES.FORBIDDEN });
		}
	};
};

export default checkPermissions;

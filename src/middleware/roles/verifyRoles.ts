import { Request, Response, NextFunction } from "express";
import type { User } from "../../models/userTypes";
import { Role } from "../../models/userEnums";

const verifyRoles = (...allowedRoles: Role[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { user } = req.cookies;
			if (!user) {
				return res.status(401).json({ message: "Authorization required." });
			}

			const hasAllowedRole = allowedRoles.includes(user.role);
			if (!hasAllowedRole) {
				return res.status(403).json({
					message: "Insufficient permissions.",
					userRole: user.role,
					requiredRoles: allowedRoles,
				});
			}

			next();
		} catch (err) {
			console.error(err);
			return res.status(500).json({ message: "Internal Server Error" });
		}
	};
};

export default verifyRoles;

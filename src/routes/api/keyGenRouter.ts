import express, { Router, Request, Response } from "express";
import { rotateKeys } from "../../utils/encryptionUtils/keyGenManagement";
import verifyJWT from "../../middleware/auth/verifyJWT";
import verifyRoles from "../../middleware/roles/verifyRoles";
import checkPermissions from "../../middleware/roles/checkPermissions";
import { Role, Action } from "../../models/userEnums";

const router: Router = express.Router();

router
	.route("/rotate-keys")
	.put(
		verifyJWT,
		verifyRoles(Role.SuperAdmin),
		checkPermissions(Action.write),
		(req, res) => {
			if (req.body.user.role === Role.SuperAdmin) {
				rotateKeys();
				res.send("Keys rotated successfully");
			} else {
				res.status(403).send("Unauthorized");
			}
		}
	);

export default router;

import express, { Router } from "express";
import {
	getAllUserProfiles,
	updateUserProfile,
	getUserProfileById,
} from "../../controllers/users/userProfileController";
import verifyRoles from "../../middleware/roles/verifyRoles";
import checkPermissions from "../../middleware/roles/checkPermissions";
import { Role, Action } from "../../models/userEnums";
import verifyJWT from "../../middleware/auth/verifyJWT";
import { body } from "express-validator";

const router: Router = express.Router();

router
	.route("/")
	.get(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.Editor),
		checkPermissions(Action.read),
		getAllUserProfiles as any
	);
router
	.route("/:userId/update")
	.put(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.User),
		checkPermissions(Action.write),
		[
			body("firstname")
				.optional()
				.isString()
				.isLength({ min: 2 })
				.withMessage("First name must be at least 2 characters long"),
			body("lastname")
				.optional()
				.isString()
				.isLength({ min: 2 })
				.withMessage("Last name must be at least 2 characters long"),
			body("phonenumber")
				.optional()
				.isMobilePhone("en-US")
				.withMessage("Please provide a valid phone number"),
			body("address")
				.optional()
				.isString()
				.isLength({ min: 2 })
				.withMessage("Address must be a valid address"),
			body("city")
				.optional()
				.isString()
				.isLength({ min: 2 })
				.withMessage("City must be a valid city"),
			body("state")
				.optional()
				.isString()
				.isLength({ min: 2 })
				.withMessage("State must be a valid state"),
		],
		updateUserProfile as any
	);
router
	.route("/:userId")
	.get(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.Editor, Role.User),
		checkPermissions(Action.read || Action.read_own),
		getUserProfileById as any
	);

export default router;

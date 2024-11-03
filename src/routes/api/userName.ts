import express, { Router } from "express";
import {
	getAllUsers,
	getUserById,
	deleteUser,
	updateUser,
	createNewUser,
	getUserByEmail,
} from "../../controllers/users/userController";
import verifyRoles from "../../middleware/roles/verifyRoles";
import checkPermissions from "../../middleware/roles/checkPermissions";
import { Role, Action } from "../../models/userEnums";
import verifyJWT from "../../middleware/auth/verifyJWT";
import { body, param } from "express-validator";

const router: Router = express.Router();

router.route("/").get(
	// verifyJWT,
	// verifyRoles(Role.Admin, Role.SuperAdmin, Role.Editor, Role.User),
	// checkPermissions(Action.read),
	getAllUsers as any
);

router
	.route("/add")
	.post(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin),
		checkPermissions(Action.write),
		[
			body("name")
				.isString()
				.isLength({ min: 2 })
				.withMessage("Name must be at least 2 characters long"),
			body("email")
				.isEmail()
				.withMessage("Please provide a valid email address"),
		],
		createNewUser as any
	);

router
	.route("/:userId/update")
	.put(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.User),
		checkPermissions(Action.write || Action.edit_own),
		[
			body("name")
				.optional()
				.isString()
				.isLength({ min: 2 })
				.withMessage("Name must be at least 2 characters long"),
			body("email")
				.optional()
				.isEmail()
				.withMessage("Please provide a valid email address"),
		],
		updateUser as any
	);

router
	.route("/:userId/del")
	.delete(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.User),
		checkPermissions(Action.delete || Action.delete_own),
		deleteUser as any
	);

router
	.route("/:userId")
	.get(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.Editor, Role.User),
		checkPermissions(Action.read || Action.read_own),
		getUserById as any
	);

router
	.route("/:userId/:name")
	.get(
		verifyJWT,
		verifyRoles(Role.Admin, Role.SuperAdmin, Role.Editor, Role.User),
		checkPermissions(Action.read || Action.read_own),
		getUserByEmail as any
	);

export default router;

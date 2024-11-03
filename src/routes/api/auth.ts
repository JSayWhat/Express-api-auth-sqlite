import express, { Router, NextFunction, Request, Response } from "express";
import authController from "../../controllers/auth/authController";
import logoutController from "../../controllers/auth/logoutController";
import refreshTokenController from "../../controllers/auth/refreshTokenController";
import registerController from "../../controllers/auth/registerController";
import verifyJWT from "../../middleware/auth/verifyJWT";
import {
	handleRegister,
	handleVerifyEmail,
} from "../../controllers/auth/emailRegisterVerification";
import { body } from "express-validator";
import { sessionTimer } from "../../controllers/auth/keepAlive";

const router: Router = express.Router();

router.route("/test").post(
	verifyJWT
	//(req: Request<{}>, res: Response) => {
	// 	console.log("Request headers:", req.headers, "Request cookies:", req.cookies);
	// 	res.json({ message: "Token is valid" });
	//}
);

router
	.route("/login")
	.post(
		[
			body("email")
				.isEmail()
				.withMessage("Please provide a valid email address"),
			body("password").notEmpty().withMessage("Password is required"),
		],
		authController
	);
router.route("/logout").post(logoutController);
router.route("/refresh").post(refreshTokenController);
router.route("/keep-alive").post(verifyJWT, sessionTimer);
router
	.route("/register")
	.post(
		[
			body("email")
				.isEmail()
				.withMessage("Please provide a valid email address"),
			body("password")
				.isLength({ min: 8 })
				.withMessage("Password must be at least 8 characters long"),
		],
		handleRegister
	);
router.route("/verify-email").get(handleVerifyEmail);
// handles registration without email verification if no email server is set up
router.route("/register-without-verification").post(registerController);

export default router;

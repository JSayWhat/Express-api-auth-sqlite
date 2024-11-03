import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { Request, Response } from "express";
import db from "../../utils/dbConnector";
import { User } from "../../models/userTypes";
import { Role } from "../../models/userEnums";
import dotenv from "dotenv";
import { argon2Password } from "../../utils/cryptoHashUtils/argon2Hash";
import {
	encryptEmail,
	decryptEmail,
} from "../../utils/encryptionUtils/deterministicEncryption";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

// Function to generate a verification token for email verification
const generateVerificationToken = (): string => {
	return randomBytes(32).toString("hex");
};

const saveVerificationToken = async (
	userId: number,
	token: string
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const sql =
			"UPDATE Users SET verificationToken = ?, isVerified = 0 WHERE userId = ?";
		db.run(sql, [token, userId], (err) => {
			if (err) {
				console.error("Database error in saveVerificationToken:", err);
				reject(err);
			} else {
				resolve();
			}
		});
	});
};

const sendVerificationEmail = async (
	email: string,
	token: string
): Promise<void> => {
	// Create a transporter
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: parseInt(process.env.EMAIL_PORT || "587"),
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	// verify connection configuration
	transporter.verify(function (error, success) {
		if (error) {
			console.log(error);
		} else {
			console.log("Server is ready to take our messages");
		}
	});

	const info = await transporter.sendMail({
		from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
		to: email,
		subject: "Please verify your email",
		text: `Please click on this link to verify your email: ${process.env.APP_URL}/verify-email?token=${token}`,
		html: `<p>Please click on this link to verify your email: <a href="${process.env.VERIFY_EMAIL_URL}/?token=${token}">Verify Email</a></p>
		<p>If you did not request this, please ignore this email.</p>
    `,
	});

	console.log("Verification email sent: %s", info.messageId);
};
///
const getUserByEmail = async (email: string): Promise<User | undefined> => {
	return new Promise((resolve, reject) => {
		// Encrypt the input email
		const encryptedEmail = encryptEmail(email);
		// Query the database using the encrypted email
		const sql = "SELECT * FROM Users WHERE email = ?";
		db.get(sql, [encryptedEmail], (err, row: User | undefined) => {
			if (err) {
				console.error("Error fetching user by email:", err.message);
				reject(err);
			} else {
				resolve(row);
			}
		});
	});
};

const insertUser = async (
	encryptedEmail: string,
	hashedPassword: string,
	role: Role,
	uuid: string
): Promise<number> => {
	return new Promise<number>((resolve, reject) => {
		const sql =
			"INSERT INTO Users (email, password, role, userId) VALUES (?, ?, ?, ?)";
		db.run(
			sql,
			[encryptedEmail, hashedPassword, role, uuid],
			function (err: Error | null) {
				if (err) reject(err);
				else {
					const lastID = (this as { lastID?: number }).lastID;
					if (lastID !== undefined) {
						resolve(lastID);
					} else {
						reject(new Error("Failed to get lastID after insert"));
					}
					console.log("lastId:", lastID);
				}
			}
		);
	});
};

const isValidPassword = (password: string): boolean => {
	// Minimum 8 characters long
	const minLength = password.length >= 8;
	// At least one uppercase letter
	const hasUppercase = /[A-Z]/.test(password);
	// At least one lowercase letter
	const hasLowercase = /[a-z]/.test(password);
	// At least one number
	const hasNumber = /\d/.test(password);
	// At least one special character
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
	// Ensure all criteria are met
	return (
		minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
	);
};

const handleRegister = async (req: Request<User>, res: Response) => {
	const { email, password }: User = req.body;

	if (!email || !password) {
		return res
			.status(400)
			.json({ message: "Email and password are required." });
	}

	if (!isValidPassword(password)) {
		return res
			.status(400)
			.json({ message: "Password does not meet strength requirements." });
	}

	try {
		const encryptedEmail = encryptEmail(email);
		const existingUser = await getUserByEmail(encryptedEmail);

		if (existingUser) {
			return res.status(409).json({ message: "Email already exists." });
		}
		const uuid = await uuidv4();
		const hashedPassword = (await argon2Password(password)) as string;

		const userId = await insertUser(
			encryptedEmail,
			hashedPassword,
			Role.User,
			uuid
		);

		// Generate and save email verification token
		const verificationToken = generateVerificationToken();
		await saveVerificationToken(userId, verificationToken);
		const verifyEmail = decryptEmail(encryptedEmail);
		await sendVerificationEmail(verifyEmail, verificationToken);

		res.status(201).json({ success: `New user ${verifyEmail} created!` });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Server Error. Failed to create user. Please try again later.",
		});
	}
};

const handleVerifyEmail = async (req: Request, res: Response) => {
	try {
		const { token } = req.query;

		if (!token || typeof token !== "string") {
			return res
				.status(400)
				.json({ message: "Valid verification token is required" });
		}

		const user: User = await new Promise((resolve, reject) => {
			db.get(
				"SELECT * FROM Users WHERE verificationToken = ?",
				[token],
				(err, row: User) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		console.log("user:", user);

		if (!user) {
			return res.status(404).json({ message: "Invalid verification token" });
		}

		// Mark user as verified and clear the token
		await new Promise<void>((resolve, reject) => {
			db.run(
				"UPDATE Users SET isVerified = 1, verificationToken = NULL WHERE userId = ?",
				[user.userId],
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		console.log("userID:", user.userId);

		res.json({ message: "Email verified successfully" });
	} catch (error) {
		console.error("Error in handleVerifyEmail:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

export { handleRegister, handleVerifyEmail };

import { Request, Response } from "express";
import { User } from "../../models/userTypes";
import { Role } from "../../models/userEnums";
import db from "../../utils/dbConnector";
import { genSalt, hash } from "bcryptjs";

const getUserByEmail = (email: string): Promise<User | undefined> => {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM Users WHERE email = ?", [email], (err, row: User) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
};

const insertUser = (
	email: string,
	hashedPassword: string,
	role: Role
): Promise<void> => {
	return new Promise((resolve, reject) => {
		db.run(
			"INSERT INTO Users (email, password, role) VALUES (?, ?, ?)",
			[email, hashedPassword, role],
			(err) => {
				if (err) reject(err);
				else resolve();
			}
		);
	});
};

const isValidPassword = (password: string): boolean => {
	// Add your password strength checks here
	return password.length >= 8; // Example: minimum 8 characters
};

const handleNewUser = async (req: Request, res: Response) => {
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
		const existingUser = await getUserByEmail(email);

		if (existingUser) {
			return res.status(409).json({ message: "Email already exists." });
		}

		const salt = await genSalt(10);
		const hashedPassword = await hash(password, salt);

		await insertUser(email, hashedPassword, Role.User);

		res.status(201).json({ success: `New user ${email} created!` });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Server Error. Failed to create user. Please try again later.",
		});
	}
};

export default handleNewUser;

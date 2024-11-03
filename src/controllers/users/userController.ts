import { Request, Response } from "express";
import db from "../../utils/dbConnector";
import type { User } from "../../models/userTypes";
import { Role } from "../../models/userEnums";
import { argon2Password } from "../../utils/cryptoHashUtils/argon2Hash";
import { v4 as uuidv4 } from "uuid";
import {
	encryptEmail,
	decryptEmail,
} from "../../utils/encryptionUtils/deterministicEncryption";

type MyResponse =
	| { err: string }
	| { data: User }
	| { Data: User[] }
	| { DecryptedUserData: User[] }
	| { message: string };

const getAllUsers = async (req: Request<User>, res: Response<MyResponse>) => {
	const sql =
		"SELECT userId, Email, createdAt, role, updatedAt, isVerified FROM users";
	try {
		const Data = await new Promise<User[]>((resolve, reject) => {
			db.all(sql, [], (err: Error | null, rows: User[]) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
		// Decrypt the fields for each user
		const DecryptedUserData: User[] = Data.map((user) => {
			return {
				...user,
				userId: user.userId,
				email: decryptEmail(user.email),
				password: user.password,
				createdAt: user.createdAt,
				role: user.role as Role,
				updatedAt: user.updatedAt,
				isVerified: user.isVerified,
			};
		});

		return res.status(200).json({ Data: DecryptedUserData });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ err: "Something went wrong" });
	}
};

const createNewUser = async (req: Request<User>, res: Response<MyResponse>) => {
	const { email, password }: User = req.body;
	// Validate input
	if (!email || !password) {
		return res.status(400).json({ message: "Missing required fields." });
	}

	try {
		// Hash the password & encrypt the email
		const encryptedEmail = await encryptEmail(email);
		const hashedPassword = await argon2Password(password);
		const userId = uuidv4();
		const sql = "INSERT INTO Users (userId, email, password) VALUES ( ?, ?)";
		await new Promise<void>((resolve, reject) => {
			db.run(sql, [encryptedEmail, hashedPassword], (err: Error | null) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
		const newUser: User = {
			userId,
			email: decryptEmail(encryptedEmail),
			password,
			role: Role.User,
			createdAt: new Date().toISOString(),
		};
		console.log(`New user created with: ${email}`);
		res.status(201).json({ data: newUser });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Failed to create new user." });
	}
};

const updateUser = async (req: Request<User>, res: Response<MyResponse>) => {
	const userId = req.params;
	const { email, password, role }: User = req.body;
	if (!email && !password && !role) {
		return res.status(400).json({ message: "Nothing to update." });
	}
	if (!userId) {
		return res.status(400).json({ message: "Invalid User Id." });
	}

	try {
		if (password !== undefined) {
			const hashedPassword = await argon2Password(password);
			req.body.password = hashedPassword;
			console.log("New Password:", req.body.password);
		}
		const hashedPassword = req.body.password;

		if (email !== undefined) {
			const encryptedEmail = await encryptEmail(email);
			req.body.email = encryptedEmail;
			console.log("New Email:", req.body.email);
		}
		const encryptedEmail = req.body.email;
		const sql =
			"UPDATE Users SET email = COALESCE(?, email), password = COALESCE(?, password), role = COALESCE(?, role), updatedAt = CURRENT_TIMESTAMP WHERE userId = ?";
		console.log("sql", sql);
		console.log("New user data", userId, encryptedEmail, hashedPassword, role);

		const result = await new Promise<{ changes: number }>((resolve, reject) => {
			db.run(
				sql,
				[encryptEmail, hashedPassword, role, userId],
				function (this: { changes: number }, err: Error | null) {
					if (err) {
						reject(err);
					} else {
						resolve({ changes: this.changes });
					}
				}
			);
		});
		console.log(`Row(s) updated: ${result.changes}. For user ID: ${userId}`);
		if (result.changes > 0) {
			console.log("User updated successfully");
			return res.status(200).json({ message: "User updated successfully." });
		} else {
			console.log("No user found with the given userId");
			return res
				.status(404)
				.json({ message: "No user found with the given userId." });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error encountered while updating" });
	}
};

const deleteUser = async (req: Request<User>, res: Response<MyResponse>) => {
	const { userId }: User = req.params;
	console.log("userId", userId);

	if (!userId) {
		return res.status(400).json({ message: "User Id required." });
	}
	const deleteUserSql = "DELETE FROM users WHERE userId = ?";
	const deleteProfileSql = "DELETE FROM userProfiles WHERE userId = ?";
	try {
		await new Promise<void>((resolve, reject) => {
			db.run("BEGIN TRANSACTION;", [], (err: Error | null) => {
				if (err) return reject(err);

				db.run(deleteProfileSql, [userId], (err: Error | null) => {
					if (err) return reject(err);

					db.run(deleteUserSql, [userId], (err: Error | null) => {
						if (err) return reject(err);

						db.run("COMMIT;", [], (err: Error | null) => {
							if (err) {
								db.run("ROLLBACK;", [], (rollbackErr: Error | null) => {
									if (rollbackErr)
										console.error("Rollback failed:", rollbackErr);
									return reject(err);
								});
								return reject(err);
							}
							resolve();
						});
					});
				});
			});
		});
		console.log(`User & profile deleted successfully for user ID ${userId}`);
		res.status(200).json({ message: "User & profile deleted successfully." });
	} catch (err) {
		console.error("Error during deletion:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
};

const getUserById = async (req: Request<User>, res: Response<MyResponse>) => {
	const { userId } = req.params;
	console.log("userId", userId);
	if (!userId) {
		return res.status(400).json({ message: "User ID required." });
	}
	const sql =
		"SELECT userId, email, createdAt, role, updatedAt, isVerified FROM users WHERE userId = ?";
	try {
		const data = await new Promise<User | undefined>((resolve, reject) => {
			db.get(sql, [userId], (err: Error, row: User) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
		if (!data) {
			return res.status(204).json({ message: `No User matches Id ${userId}.` });
		}
		const decryptedData: User = {
			userId: data.userId,
			email: decryptEmail(data.email),
			password: data.password,
			createdAt: data.createdAt,
			role: data.role as Role,
			updatedAt: data.updatedAt,
			isVerified: data.isVerified,
		};

		return res.status(200).json({ data: decryptedData });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

const getUserByEmail = async (
	req: Request<User>,
	res: Response<MyResponse>
) => {
	const email = req.body;
	if (!email) {
		return res.status(400).json({ message: "Email required." });
	}
	try {
		const encryptedEmail = await encryptEmail(email);
		const sql =
			"SELECT userId, email, createdAt, role, updatedAt, isVerified FROM users WHERE email = ?";

		const data = await new Promise<User | undefined>((resolve, reject) => {
			db.get(sql, [encryptedEmail], (err: Error, row: User) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
		if (!data) {
			return res
				.status(204)
				.json({ message: `No User matches the email ${email}.` });
		}
		const decryptedData: User = {
			userId: data.userId,
			email: decryptEmail(data.email),
			password: data.password,
			createdAt: data.createdAt,
			role: data.role as Role,
			updatedAt: data.updatedAt,
			isVerified: data.isVerified,
		};

		return res.status(200).json({ data: decryptedData });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export {
	getAllUsers,
	getUserById,
	deleteUser,
	updateUser,
	createNewUser,
	getUserByEmail,
};

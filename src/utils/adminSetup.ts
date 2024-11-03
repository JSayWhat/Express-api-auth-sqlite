import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import type { User } from "../models/userTypes";
import { Role } from "../models/userEnums";
import { argon2Password } from "./cryptoHashUtils/argon2Hash";
import { encryptEmail } from "./encryptionUtils/deterministicEncryption";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

const adminEmail = process.env.SUPER_ADMIN_EMAIL || "Admin@localhost.test";
const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "!adminPassword123";

async function setupAdmin(db: sqlite3.Database) {
	if (!adminEmail || !adminPassword) {
		throw new Error(
			"SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not defined in the environment variables."
		);
	}

	async function isAdmin(db: sqlite3.Database): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const sql = "SELECT * FROM Users";
			db.get(sql, (err, row: User) => {
				if (err) {
					console.error("Error checking users table:", err.message);
					return reject(err);
				}
				if (!row) {
					// User does not exist
					return resolve(false);
				}
				const foundRole = row.role;
				resolve(foundRole === Role.SuperAdmin);
			});
		});
	}

	// Hash the admin password
	const hashedPassword = await argon2Password(adminPassword);
	const encryptedAdminEmail = await encryptEmail(adminEmail);
	const role = Role.SuperAdmin;
	const uuid = uuidv4();
	// Check if admin exists
	const adminExists = await new Promise<boolean>((resolve, reject) => {
		db.get("SELECT * FROM Users WHERE Role = ?", [role], (err, row) => {
			if (err) {
				console.error("Error checking for admin user:", err.message);
				reject(err);
			} else {
				resolve(!!row);
			}
		});
	});

	if (!adminExists) {
		// Admin does not exist, insert the admin user
		await new Promise<void>((resolve, reject) => {
			db.run(
				"INSERT INTO Users (email, password, role, userId) VALUES (?, ?, ?, ?)",
				[encryptedAdminEmail, hashedPassword, role, uuid],
				(err) => {
					if (err) {
						console.error("Error inserting admin user:", err.message);
						reject(err);
					} else {
						console.log("Admin user created successfully.");
						resolve();
					}
				}
			);
		});
	} else {
		console.log("Admin user already exists.");
	}
	return isAdmin(db);
}

export default setupAdmin;

import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import setupAdmin from "./adminSetup";

dotenv.config();

const DEFAULT_DATABASE_DIR = process.env.DEFAULT_DATABASE_DIR || "database";
const DEFAULT_DATABASE_FILE =
	process.env.DEFAULT_DATABASE_FILE || "default_database.sqlite";
const DATABASE_DIR = process.env.DATABASE_DIR || DEFAULT_DATABASE_DIR;
// Ensure the directory exists
if (!fs.existsSync(DATABASE_DIR)) {
	fs.mkdirSync(DATABASE_DIR, { recursive: true });
}
const DATABASE_URL =
	process.env.DATABASE_URL || path.join(DATABASE_DIR, DEFAULT_DATABASE_FILE);
if (!DATABASE_URL || typeof DATABASE_URL !== "string") {
	console.error(
		"DATABASE_URL environment variable is not defined or is not a string."
	);
	process.exit(1); // Exit the process if DATABASE_URL is not properly defined
}
// Connect to the database
const db = new sqlite3.Database(
	DATABASE_URL,
	sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
	(err) => {
		if (err) {
			console.error("Error connecting to database:", err.message);
		} else {
			console.log("Connected to Database");
			setupAdmin(db); // Setup admin user after connecting to the database
		}
	}
);

db.serialize(() => {
	// Create the Users table
	db.run(`CREATE TABLE IF NOT EXISTS Users (
        userId TEXT PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP,
        role TEXT DEFAULT 'User' CHECK(role IN ('User', 'Editor', 'Admin', 'SuperAdmin')),
        accessToken TEXT,
        refreshToken TEXT,
        verificationToken TEXT,
        isVerified INTEGER DEFAULT 0,
        lastLoginAt TIMESTAMP
    )`);
	// Create the OAuth table
	db.run(`CREATE TABLE IF NOT EXISTS OAuth (
        provider_id TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        userId INTEGER NOT NULL,
        PRIMARY KEY (provider_id, provider_user_id),
        FOREIGN KEY (userId) REFERENCES Users (userId)
    )`);
	// Create the Sessions table
	db.run(`CREATE TABLE IF NOT EXISTS Session (
        sessionId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        SESSION_START_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        LAST_ACTIVITY TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        SESSION_END_TIME TIMESTAMP DEFAULT NULL,
        loginDuration INTEGER AS (
        CASE 
            WHEN SESSION_END_TIME IS NOT NULL 
            THEN strftime('%s', SESSION_END_TIME) - strftime('%s', SESSION_START_TIME) 
            ELSE NULL 
        END
    ) STORED, 
        formattedDuration TEXT AS (
        CASE 
            WHEN loginDuration IS NOT NULL THEN printf('%02d:%02d:%02d', 
            loginDuration / 3600, (loginDuration % 3600) / 60, loginDuration % 60)
            ELSE NULL 
        END
    ) STORED,
        FOREIGN KEY (userId) REFERENCES Users (userId)
    )`);
	// Create the UserProfiles table
	db.run(`CREATE TABLE IF NOT EXISTS UserProfiles (
        profileId TEXT NOT NULL,
        userId TEXT NOT NULL,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        phonenumber TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        profilePicture BLOB,
        updatedAt TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users (userId)
    )`);
	// Create trigger to insert user into Users table after OAuth is created
	db.run(`CREATE TRIGGER IF NOT EXISTS create_Users
    AFTER INSERT ON OAuth FOR EACH ROW
        BEGIN
        INSERT INTO Users (userId, email, password, role) VALUES (NEW.userId, '', '', 'User');
    END`);
	// Create trigger to insert into UserProfile table when a new user is created
	db.run(`CREATE TRIGGER IF NOT EXISTS create_UserProfiles AFTER INSERT ON Users FOR EACH ROW
    BEGIN
        INSERT INTO UserProfiles (profileId, userId, firstname, lastname, phonenumber, address, city, state, profilePicture, updatedAt)
        VALUES (NEW.userId, NEW.userId, '', '', '', '', '', '', NULL, NULL);
    END`);
	// Create trigger to update the updatedAt column in UserProfile and Users tables
	db.run(`CREATE TRIGGER IF NOT EXISTS update_UserProfiles_updatedAt AFTER UPDATE ON UserProfiles FOR EACH ROW 
        BEGIN 
        UPDATE UserProfiles SET updatedAt = CURRENT_TIMESTAMP WHERE profileId = OLD.profileId; 
    END;`);
	db.run(`CREATE TRIGGER IF NOT EXISTS update_Users_updatedAt AFTER UPDATE ON Users FOR EACH ROW 
        BEGIN 
        UPDATE Users SET updatedAt = CURRENT_TIMESTAMP WHERE userId = OLD.userId; 
    END;`);
});

export default db;

import crypto from "crypto";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const ENV_PATH = path.resolve(process.cwd(), ".env");

interface KeyPair {
	key: string;
	iv: string;
	createdAt: string;
}

export function generateKey(): string {
	return crypto.randomBytes(32).toString("hex");
}

export function generateIV(): string {
	return crypto.randomBytes(16).toString("hex");
}

export function writeKeysToEnv(newKeyPair: KeyPair): void {
	let envContent = fs.existsSync(ENV_PATH)
		? fs.readFileSync(ENV_PATH, "utf8")
		: "";

	// Read existing keys
	const existingKeys = readKeysFromEnv();

	// Add new key pair
	existingKeys.unshift(newKeyPair);

	const keyCount = process.env.KEY_COUNT
		? parseInt(process.env.KEY_COUNT, 10)
		: 200;
	// Limit to keeping last 20 keys (adjust as needed)
	const keysToKeep = existingKeys.slice(0, keyCount);

	// Update .env content
	envContent = envContent.replace(/ENCRYPTION_KEYS=.*(\r?\n|$)/g, "");
	envContent += `ENCRYPTION_KEYS=${JSON.stringify(keysToKeep)}\n`;

	fs.writeFileSync(ENV_PATH, envContent);
	console.log("New encryption key has been added to .env file");
}

export function readKeysFromEnv(): KeyPair[] {
	const keysJson = process.env.ENCRYPTION_KEYS;
	if (!keysJson) {
		return [];
	}
	try {
		return JSON.parse(keysJson) as KeyPair[];
	} catch (error) {
		console.error("Error parsing ENCRYPTION_KEYS:", error);
		return [];
	}
}

export function initializeKeys(): void {
	const existingKeys = readKeysFromEnv();
	if (existingKeys.length === 0) {
		const newKeyPair: KeyPair = {
			key: generateKey(),
			iv: generateIV(),
			createdAt: new Date().toISOString(),
		};
		writeKeysToEnv(newKeyPair);
		console.log(
			"Initial encryption key has been generated and saved to .env file"
		);
	} else {
		console.log("Encryption keys already exist in .env file");
	}
}

export function rotateKeys(): void {
	const newKeyPair: KeyPair = {
		key: generateKey(),
		iv: generateIV(),
		createdAt: new Date().toISOString(),
	};
	writeKeysToEnv(newKeyPair);
	console.log("New encryption key has been generated and added to .env file");
}

export function getLatestKey(): KeyPair | undefined {
	const keys = readKeysFromEnv();
	return keys[0]; // The most recent key is at the start of the array
}

export function getKeyForDate(date: Date): KeyPair | undefined {
	const keys = readKeysFromEnv();
	return keys.find((keyPair) => new Date(keyPair.createdAt) <= date);
}

import crypto from "crypto";
import { getLatestKey, getKeyForDate } from "./keyGenManagement";

const ENCRYPTION_ALGORITHM = process.env.ENCRYPTION_ALGORITHM || "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16 bytes

interface EncryptedData {
	data: string;
	timestamp: string;
}

// Encrypt data
export function encryptData(data: string): string {
	try {
		const latestKeyPair = getLatestKey();
		if (!latestKeyPair) {
			throw new Error("No encryption keys available");
		}

		const { key } = latestKeyPair;
		const timestamp = new Date().toISOString();

		const randomIv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(
			ENCRYPTION_ALGORITHM,
			Buffer.from(key, "hex"),
			randomIv
		);

		let encrypted = cipher.update(data, "utf8", "hex");
		encrypted += cipher.final("hex");

		const encryptedData: EncryptedData = {
			data: randomIv.toString("hex") + ":" + encrypted,
			timestamp: timestamp,
		};

		return JSON.stringify(encryptedData);
	} catch (error) {
		console.error("Encryption error:", error);
		throw new Error("Encryption failed");
	}
}

// Decrypt data
export function decryptData(
	encryptedDataString: string | null | undefined
): string {
	if (!encryptedDataString) {
		// If the encryptedDataString is null or undefined, return an empty string or handle accordingly
		return "";
	}
	try {
		const encryptedData: EncryptedData = JSON.parse(encryptedDataString);
		const keyPair = getKeyForDate(new Date(encryptedData.timestamp));

		if (!keyPair) {
			throw new Error("No valid encryption key found for the given date");
		}

		const { key } = keyPair;

		const textParts = encryptedData.data.split(":");
		const randomIv = Buffer.from(textParts.shift() || "", "hex");
		const encryptedText = Buffer.from(textParts.join(":"), "hex");

		const decipher = crypto.createDecipheriv(
			ENCRYPTION_ALGORITHM,
			Buffer.from(key, "hex"),
			randomIv
		);

		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);

		return decrypted.toString("utf8");
	} catch (error) {
		console.error("Decryption error:", error);
		throw new Error("Decryption failed");
	}
}

// Hash data
export function hashData(data: string): string {
	return crypto.createHash("sha256").update(data).digest("hex");
}

// Generate a random token
export function generateToken(length: number = 32): string {
	return crypto.randomBytes(length).toString("hex");
}

// Constant-time comparison (to prevent timing attacks)
export function safeCompare(a: string, b: string): boolean {
	return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

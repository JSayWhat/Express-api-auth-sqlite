import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_ALGORITHM = process.env.ENCRYPTION_ALGORITHM || "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const EMAIL_ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;

if (!EMAIL_ENCRYPTION_KEY) {
	throw new Error("EMAIL_ENCRYPTION_KEY must be set in environment variables");
}

interface EncryptedData {
	data: string;
}

// Encrypt email using a deterministic approach
export function encryptEmail(data: string): string {
	try {
		const key = Buffer.from(EMAIL_ENCRYPTION_KEY!, "hex");

		const randomIv = Buffer.alloc(IV_LENGTH, 0); // Use a static IV for deterministic encryption
		const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, randomIv);

		let encrypted = cipher.update(data, "utf8", "hex");
		encrypted += cipher.final("hex");

		const encryptedData: EncryptedData = {
			data: encrypted,
		};

		return JSON.stringify(encryptedData);
	} catch (error) {
		console.error("Encryption error:", error);
		throw new Error("Encryption failed");
	}
}

// Decrypt email
export function decryptEmail(
	encryptedDataString: string | null | undefined
): string {
	if (!encryptedDataString) {
		// If the encryptedDataString is null or undefined, return an empty string or handle accordingly
		return "";
	}
	try {
		const encryptedData: EncryptedData = JSON.parse(encryptedDataString);
		const key = Buffer.from(EMAIL_ENCRYPTION_KEY!, "hex");

		const textParts = encryptedData.data.split(":");
		const randomIv = Buffer.alloc(IV_LENGTH, 0); // Use the same static IV
		const encryptedText = Buffer.from(textParts.join(":"), "hex");

		const decipher = crypto.createDecipheriv(
			ENCRYPTION_ALGORITHM,
			key,
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

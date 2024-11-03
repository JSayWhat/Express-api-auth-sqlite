import crypto from "crypto";

// Hashes an email and still makes it searchable using a technique called deterministic hashing. (creates a consistent hash for a given email)
// Caveat - this is not a secure way to hash emails, as it is deterministic and can be reversed.
// IMPORTANT - With Hashing there is no way to view the email in the database
async function hashEmail(email: string): Promise<string> {
	try {
		const hashedEmail = crypto.createHash("sha256").update(email).digest("hex");
		return hashedEmail;
	} catch (error) {
		console.error("Failed to hash email", error);
		throw new Error("Hashing failed");
	}
}

// Compares a plain-text email to a hashed email by hashing the plain-text email and comparing the result
async function compareHashedEmail(
	email: string,
	hashedEmail: string
): Promise<boolean> {
	try {
		// Hash the provided plain-text email
		const emailHash = crypto.createHash("sha256").update(email).digest("hex");
		// Compare the newly hashed email with the provided hashed email
		return emailHash === hashedEmail;
	} catch (error) {
		console.error("Failed to compare emails", error);
		throw new Error("Comparison failed");
	}
}
export { hashEmail, compareHashedEmail };

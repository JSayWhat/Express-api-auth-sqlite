import argon2 from "argon2";

async function argon2Password(password: string) {
	try {
		const hashedPassword = await argon2.hash(password);
		return hashedPassword;
	} catch (error) {
		console.error(error);
		console.error("Failed to hash password with argon2");
	}
}

async function compareArgonPasswords(password: string, hashedPassword: string) {
	try {
		const isPasswordValid = await argon2.verify(hashedPassword, password);
		return isPasswordValid;
	} catch (error) {
		console.error(error);
		console.error("Failed to compare passwords with argon2");
	}
}

export { argon2Password, compareArgonPasswords };

import { genSalt, hash, compare } from "bcryptjs";

async function bcryptPassword(password: string) {
	try {
		const salt = await genSalt(10);
		const hashedPassword = await hash(password, salt);
		return hashedPassword;
	} catch (error) {
		console.error(error);
		console.error("Failed to hash password with bcrypt");
	}
}

async function compareBcryptPasswords(
	password: string,
	hashedPassword: string
) {
	try {
		const isPasswordValid = await compare(password, hashedPassword);
		return isPasswordValid;
	} catch (error) {
		console.error(error);
		console.error("Failed to compare passwords with bcrypt");
	}
}

export { bcryptPassword, compareBcryptPasswords };

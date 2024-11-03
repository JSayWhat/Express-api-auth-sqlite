import { Role } from "./userEnums";

interface User {
	userId: string;
	email: string;
	password: string;
	createdAt: string;
	updatedAt?: string;
	role: Role;
	accessToken?: string;
	refreshToken?: string;
	verificationToken?: string;
	isVerified?: boolean;
	oAuth?: OAuth;
	session?: Session;
	lastLoginAt?: string;
	userProfile?: userProfile | null;
}
interface OAuth {
	provider_id: string;
	provider_user_id: string;
	userId: string;
}
interface Session extends User {
	sessionId: number;
	userId: string;
	sessionStartTime: string;
	lastActivity: string;
	sessionEndTime: string;
	loginDuration: number;
	formattedDuration: string;
}

interface Database {
	users: User[];
	session: Session[];
	oAuth: OAuth[];
	userProfile: userProfile[];
}

interface userPicture {
	data: string;
	width: number;
	height: number;
	altText?: string;
	caption?: string;
}

type profilePicture = string | userPicture;

interface userProfile extends User {
	profileId: string;
	firstname: string;
	lastname: string;
	phonenumber: string;
	address: string;
	city: string;
	state: string;
	profilePicture?: profilePicture;
	updatedAt?: string;
}

export { userPicture, userProfile, User, Database, Session, OAuth };

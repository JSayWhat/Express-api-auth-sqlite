import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(",")
	: [];

const credentials = (req: Request, res: Response, next: NextFunction) => {
	const origin = req.headers.origin as string;
	if (allowedOrigins.includes(origin)) {
		res.header("Access-Control-Allow-Credentials", "true");
	}
	next();
};

export default credentials;

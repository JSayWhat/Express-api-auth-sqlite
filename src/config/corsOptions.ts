import dotenv from "dotenv";
dotenv.config();

interface CorsOptions {
	origin: (
		origin: string | undefined,
		callback: (error: Error | null, success: boolean) => void
	) => void;
	optionsSuccessStatus: number;
	credentials: boolean;
}
const allowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(",")
	: [];
const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		if (allowedOrigins.indexOf(origin!) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error(`Origin ${origin} not allowed by CORS`), false);
		}
	},
	optionsSuccessStatus: 200,
	credentials: true,
};
export default corsOptions;

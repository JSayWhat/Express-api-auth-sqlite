import { Request, Response, NextFunction } from "express";

class AppError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
	}
}

const statusMessages: { [key: number]: string } = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	406: "Not Acceptable",
	408: "Request Timeout",
	409: "Conflict",
	413: "Payload Too Large",
	415: "Unsupported Media Type",
	422: "Unprocessable Entity",
	429: "Too Many Requests",
	500: "Internal Server Error",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
	// Less common status codes
	402: "Payment Required",
	407: "Proxy Authentication Required",
};

const appErrorHandler = (
	err: AppError,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (err instanceof AppError) {
		const message =
			err.message || statusMessages[err.statusCode] || "Unknown Error";
		res.status(err.statusCode).json({ message });
	} else {
		console.error(err);
		res.status(500).json({ message: "Unknown Error" });
	}
};

export { AppError, appErrorHandler };

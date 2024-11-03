import { logEvents } from "./logEvents";
import { Request, Response, NextFunction } from "express";
import { AppError, appErrorHandler } from "./appError";

const errorHandler = (
	err: Error | AppError,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	let statusCode = 500;
	if (err instanceof AppError) {
		statusCode = err.statusCode;
		logEvents(`${err.name}: ${err.message}`, "errLog.txt", statusCode);
		appErrorHandler(err, req, res, next);
	} else {
		logEvents(`${err.name}: ${err.message}`, "errLog.txt", statusCode);
		res
			.status(statusCode)
			.json({ message: err.message || "Internal Server Error" });
	}
	console.error(err.stack);
};

export default errorHandler;

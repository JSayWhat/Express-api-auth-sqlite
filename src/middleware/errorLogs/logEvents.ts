import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";

const logEvents = async (
	message: string,
	logName: string,
	statusCode?: number
): Promise<void> => {
	const dateTime = `${format(new Date(), "yyyyMMdd\tHH:mm:ss")}`;
	const logItem = `${dateTime}\t${uuid()}\t${message}${
		statusCode ? `\tStatus: ${statusCode}` : ""
	}\n`;
	try {
		const logsDir = path.join(__dirname, "..", "logs");
		if (!fs.existsSync(logsDir)) {
			await fsPromises.mkdir(logsDir);
		}

		await fsPromises.appendFile(path.join(logsDir, logName), logItem);
	} catch (err) {
		console.error("Failed to log event:", err);
	}
};

const logger = (req: Request, res: Response, next: NextFunction): void => {
	const origin = req.headers.origin || "Unknown Origin";
	logEvents(`${req.method}\t${origin}\t${req.url}`, "reqLog.txt");
	console.log(`${req.method} ${req.path}`);
	next();
};

export { logger, logEvents };

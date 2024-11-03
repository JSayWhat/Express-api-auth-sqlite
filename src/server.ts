import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { logger } from "./middleware/errorLogs/logEvents";
import cors from "cors";
import corsOptions from "./config/corsOptions";
import cookieParser from "cookie-parser";
import path from "path";
import credentials from "./middleware/auth/credentials";
import dotenv from "dotenv";
import https from "https";
import fs from "fs";
import {
	sessionMiddleware,
	updateSessionEndTime,
} from "./middleware/auth/sessionTimeout";

import { initializeKeys } from "./utils/encryptionUtils/keyGenManagement";
//Routes
import userName from "./routes/api/userName";
import userProfile from "./routes/api/userProfile";
import authRouter from "./routes/api/auth";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3500;

const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";
const KEY = process.env.SSL_KEY || "";
const CERT = process.env.SSL_CERT || "";
// Read your SSL certificate and key
const options = {
	key: fs.readFileSync(KEY),
	cert: fs.readFileSync(CERT),
};

console.log("Server Here!");
// custom middleware logger
app.use(logger);
// Handle options credentials check - before CORS! and fetch cookies credentials requirement
app.use(credentials);
// provides configuration options for securing different HTTP headers
app.use(helmet());
// Cross Origin Resource Sharing
app.use(cors(corsOptions));
// Built-in middleware to handle urlencoded data "content-type: application/x-www-form-urlencoded"
app.use(express.urlencoded({ extended: false }));
// Built-in middleware for json
app.use(express.json());
//middleware for cookies
app.use(cookieParser());
// Initialize encryption keys
initializeKeys();
// Session Timeout Middleware
// app.use(sessionMiddleware);

app.use("/api/auth", authRouter);
app.use("/api/users", userName);
app.use("/api/userProfile", userProfile);

setInterval(updateSessionEndTime, 2 * 60 * 1000); // 2-minute interval

// 404 Route Handler
app.all("/*", (req: Request, res: Response, next: NextFunction) => {
	res.status(404);
	// Check what the client accepts
	if (req.accepts("html")) {
		// Send the HTML file
		res.sendFile(path.join(__dirname, "views", "404.html"));
	} else if (req.accepts("json")) {
		// Send JSON response
		res.json({ error: "404 Not Found" });
	} else {
		// Send plain text
		res.type("txt").send("404 Not Found");
	}
});

if (NODE_ENV === "PRODUCTION") {
	https.createServer(options, app).listen(port, () => {
		console.log(`HTTPS ⚡️server is running on port:${port}`);
	});
} else {
	app.listen(port, () => {
		console.log(`DEV MODE -> HTTP ⚡️server is running on port:${port}`);
	});
}

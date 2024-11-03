import { Request, Response } from "express";
import db from "../../utils/dbConnector";
import type { userProfile } from "../../models/userTypes";
import {
	encryptData,
	decryptData,
} from "../../utils/encryptionUtils/encryption";

type MyResponse =
	| { err: string }
	| { data: userProfile }
	| { decryptedData: userProfile[] }
	| { message: string };

const getAllUserProfiles = async (
	req: Request<userProfile>,
	res: Response<MyResponse>
) => {
	const sql = "SELECT * FROM UserProfiles";
	try {
		const data = await new Promise<userProfile[]>((resolve, reject) => {
			db.all(sql, [], (err: Error | null, rows: userProfile[]) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
		// Decrypt the fields for each profile
		const decryptedData: userProfile[] = data.map((profile) => {
			return {
				...profile,
				profileId: profile.profileId,
				firstname: decryptData(profile.firstname),
				lastname: decryptData(profile.lastname),
				phonenumber: decryptData(profile.phonenumber),
				address: decryptData(profile.address),
				city: decryptData(profile.city),
				state: decryptData(profile.state),
				profilePicture: profile.profilePicture, // Assuming the profile picture is not encrypted
				updatedAt: profile.updatedAt,
			};
		});
		return res.status(200).json({ decryptedData });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ err: "Something went wrong" });
	}
};

const updateUserProfile = async (
	req: Request<userProfile>,
	res: Response<MyResponse>
) => {
	let { firstname, lastname, phonenumber, address, city, state }: userProfile =
		req.body;
	const { profileId, profilePicture }: userProfile = req.body;
	const userId = req.params;
	if (!userId) {
		return res.status(400).json({ message: "User Id parameter is required." });
	}
	const Firstname = encryptData(firstname);
	const Lastname = encryptData(lastname);
	const Phonenumber = encryptData(phonenumber);
	const Address = encryptData(address);
	const City = encryptData(city);
	const State = encryptData(state);

	console.log("Request Body:", req.body);
	const sql =
		"UPDATE UserProfiles SET firstname = COALESCE(?, firstname), lastname = COALESCE(?, lastname), phonenumber = COALESCE(?, phonenumber), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state), profilePicture = COALESCE(?, profilePicture), updatedAt = CURRENT_TIMESTAMP WHERE profileId = ?";
	try {
		await new Promise<void>((resolve, reject) => {
			db.run(
				sql,
				[
					Firstname,
					Lastname,
					Phonenumber,
					Address,
					City,
					State,
					profilePicture,
					profileId,
				],
				(err: Error | null) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				}
			);
		});
		console.log(
			`User profile updated successfully for profile Id: ${profileId}`
		);
		return res.status(200).json({
			message: `User profile updated successfully for profile Id: ${profileId}`,
		});
	} catch (err) {
		console.log(err);
		return res
			.status(500)
			.json({ message: "Error encountered while updating" });
	}
};

const getUserProfileById = async (
	req: Request<userProfile>,
	res: Response<MyResponse, userProfile>
) => {
	const userId: string = req.params.userId;
	if (!userId) {
		return res.status(400).json({ message: "User ID required." });
	}
	const sql = "SELECT * FROM UserProfiles WHERE userId = ?";
	try {
		const data = await new Promise<userProfile | null>((resolve, reject) => {
			db.get(sql, [userId], (err: Error | null, row: userProfile | null) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
		if (!data) {
			return res
				.status(204)
				.json({ message: `No User Profile matches Id ${userId}.` });
		}
		// Decrypt the fields and only return the selected ones
		const decryptedData: userProfile = {
			userId: data.userId,
			profileId: data.profileId,
			firstname: decryptData(data.firstname),
			lastname: decryptData(data.lastname),
			phonenumber: decryptData(data.phonenumber),
			address: decryptData(data.address),
			city: decryptData(data.city),
			state: decryptData(data.state),
			email: decryptData(data.email),
			password: decryptData(data.password),
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			role: data.role,
		};
		return res.status(200).json({ data: decryptedData });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

export { getAllUserProfiles, updateUserProfile, getUserProfileById };

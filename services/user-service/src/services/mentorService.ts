import { ddb, TABLE_NAME } from "../db/dbClient.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import APIError from "../types/APIError.js";
import { IMentorProfile } from "../models/MentorProfile.js";

export const createMentorProfile = async (mentorProfile: IMentorProfile) => {
    try {
        const item = {
            PK: `USER#${mentorProfile.userId}`,
            SK: "MENTORPROFILE",
            ...mentorProfile,
        };

        await ddb.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item,
            })
        );

        return item;
    } catch (err: any) {
        console.error("Error creating mentor profile:", err);
        throw new APIError("Could not create mentor profile", 500);
    }
};

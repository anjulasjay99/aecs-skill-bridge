import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ddb, TABLE_NAME } from "../db/dbClient.js";
import {
    PutCommand,
    GetCommand,
    QueryCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import APIError from "../types/APIError.js";
import { IUser } from "../models/UserModel.js";
import { Role } from "../types/Enums.js";

export const createUser = async (user: IUser) => {
    // Check if user already exists by email
    const existing = await ddb.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND SK = :sk",
            ExpressionAttributeValues: {
                ":pk": `USER#${user.email}`,
                ":sk": "PROFILE",
            },
        })
    );

    if (existing.Count && existing.Count > 0) {
        throw new APIError("User already exists", 400);
    }

    const item = {
        PK: `USER#${user.email}`,
        SK: "PROFILE",
        ...user,
    };

    await ddb.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        })
    );

    return item;
};

export const authUser = async (email: string, password: string) => {
    const result = await ddb.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `USER#${email}`, SK: "PROFILE" },
        })
    );

    const user = result.Item;
    if (!user) throw new APIError("User not found", 404);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new APIError("Invalid credentials", 400);

    const token = jwt.sign({ user }, "secret");
    return token;
};

export const getUserById = async (_id: string) => {
    const result = await ddb.send(
        new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "#id = :idVal AND SK = :sk",
            ExpressionAttributeNames: { "#id": "_id" },
            ExpressionAttributeValues: {
                ":idVal": _id,
                ":sk": "PROFILE",
            },
        })
    );

    return result.Items?.[0] || null;
};

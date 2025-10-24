// @ts-nocheck
import { v4 as uuidv4 } from "uuid";
import {
    PutCommand,
    ScanCommand,
    QueryCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "../db/dbClient.js";

export const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "Files";

/**
 * Create new file record
 */
export const createFile = async (data) => {
    const _id = uuidv4();
    const createdAt = new Date().toISOString();

    const file = {
        _id,
        mentorId: data.mentorId,
        menteeId: data.menteeId,
        slotId: data.slotId,
        fileName: data.fileName,
        fileType: data.fileType,
        url: data.url,
        createdAt,
    };

    await ddb.send(
        new PutCommand({
            TableName: DYNAMO_TABLE,
            Item: file,
        })
    );

    return file;
};

/**
 * Get all files for a specific slot
 */
export const getFilesSlotById = async (slotId) => {
    let files = [];

    try {
        const result = await ddb.send(
            new QueryCommand({
                TableName: DYNAMO_TABLE,
                IndexName: "SlotIndex", // must exist
                KeyConditionExpression: "slotId = :sid",
                ExpressionAttributeValues: { ":sid": slotId },
            })
        );
        files = result.Items || [];
    } catch {
        // fallback for local
        const scan = await ddb.send(
            new ScanCommand({
                TableName: DYNAMO_TABLE,
                FilterExpression: "slotId = :sid",
                ExpressionAttributeValues: { ":sid": slotId },
            })
        );
        files = scan.Items || [];
    }

    return files;
};

/**
 * Get single file by ID
 */
export const getFileById = async (fileId) => {
    const res = await ddb.send(
        new ScanCommand({
            TableName: DYNAMO_TABLE,
            FilterExpression: "#id = :fid",
            ExpressionAttributeNames: { "#id": "_id" },
            ExpressionAttributeValues: { ":fid": fileId },
        })
    );

    return res.Items?.[0] || null;
};

/**
 * Delete a file
 */
export const deleteFile = async (fileId) => {
    await ddb.send(
        new DeleteCommand({
            TableName: DYNAMO_TABLE,
            Key: { _id: fileId },
        })
    );

    return true;
};

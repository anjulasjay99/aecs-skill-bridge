// @ts-nocheck
import { v4 as uuidv4 } from "uuid";
import {
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "../db/dbClient.js";

export const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "Availability";

/**
 * Create a new availability slot
 */
export const createAvailabilitySlot = async (data) => {
    const _id = uuidv4();
    const createdAt = new Date().toISOString();

    const slot = {
        _id,
        mentorId: data.mentorId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        isAvailable: true,
        isBooked: false,
        bookingId: null,
        createdAt,
        updatedAt: createdAt,
    };

    await ddb.send(
        new PutCommand({
            TableName: DYNAMO_TABLE,
            Item: slot,
        })
    );

    return slot;
};

/**
 * Get slots for a mentor (with optional filters)
 */
export const getAvailabilitySlots = async (mentorId, filters = {}) => {
    // Query by mentorId (if GSI exists) else fallback to Scan
    let slots = [];

    try {
        const res = await ddb.send(
            new QueryCommand({
                TableName: DYNAMO_TABLE,
                IndexName: "MentorIndex", // must exist
                KeyConditionExpression: "mentorId = :mid",
                ExpressionAttributeValues: {
                    ":mid": mentorId,
                },
            })
        );
        slots = res.Items || [];
    } catch {
        // fallback for local (no index)
        const scanRes = await ddb.send(
            new ScanCommand({
                TableName: DYNAMO_TABLE,
                FilterExpression: "mentorId = :mid",
                ExpressionAttributeValues: { ":mid": mentorId },
            })
        );
        slots = scanRes.Items || [];
    }

    // Apply in-memory filters
    if (filters.date) slots = slots.filter((s) => s.date === filters.date);
    if (filters.isAvailable !== undefined)
        slots = slots.filter((s) => s.isAvailable === filters.isAvailable);
    if (filters.isBooked !== undefined)
        slots = slots.filter((s) => s.isBooked === filters.isBooked);

    // Sort chronologically
    slots.sort((a, b) => {
        const aKey = `${a.date}T${a.startTime}`;
        const bKey = `${b.date}T${b.startTime}`;
        return new Date(aKey) - new Date(bKey);
    });

    return slots;
};

/**
 * Get a single slot by ID
 */
export const getSlotById = async (slotId) => {
    const res = await ddb.send(
        new ScanCommand({
            TableName: DYNAMO_TABLE,
            FilterExpression: "#id = :sid",
            ExpressionAttributeNames: { "#id": "_id" },
            ExpressionAttributeValues: { ":sid": slotId },
        })
    );

    return res.Items?.[0] || null;
};

/**
 * Update a slot
 */
export const updateAvailabilitySlot = async (slotId, updateData) => {
    const updatedAt = new Date().toISOString();

    const updateExp = [];
    const names = {};
    const values = { ":updatedAt": updatedAt };

    Object.keys(updateData).forEach((key) => {
        updateExp.push(`#${key} = :${key}`);
        names[`#${key}`] = key;
        values[`:${key}`] = updateData[key];
    });

    const UpdateExpression = `SET ${updateExp.join(
        ", "
    )}, updatedAt = :updatedAt`;

    const res = await ddb.send(
        new UpdateCommand({
            TableName: DYNAMO_TABLE,
            Key: { _id: slotId },
            UpdateExpression,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ReturnValues: "ALL_NEW",
        })
    );

    return res.Attributes;
};

/**
 * Delete a slot
 */
export const deleteAvailabilitySlot = async (slotId) => {
    await ddb.send(
        new DeleteCommand({
            TableName: DYNAMO_TABLE,
            Key: { _id: slotId },
        })
    );
    return true;
};

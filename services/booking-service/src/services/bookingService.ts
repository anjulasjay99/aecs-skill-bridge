// @ts-nocheck
import { v4 as uuidv4 } from "uuid";
import {
    PutCommand,
    ScanCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "../db/dbClient.js";

export const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "Bookings";

/**
 * Create booking
 */
export const createBooking = async (data) => {
    const _id = uuidv4();
    const createdDate = new Date().toISOString();

    const booking = {
        _id,
        mentorId: data.mentorId,
        menteeId: data.menteeId,
        slotId: data.slotId,
        payment: data.payment,
        isConfirmed: data.isConfirmed ?? false,
        createdDate,
    };

    await ddb.send(
        new PutCommand({
            TableName: DYNAMO_TABLE,
            Item: booking,
        })
    );

    return booking;
};

/**
 * Get all bookings with optional filters (mentorId, menteeId, slotId)
 */
export const getBookings = async (filters = {}) => {
    let bookings = [];

    // Try using GSIs if they exist
    try {
        if (filters.mentorId) {
            const res = await ddb.send(
                new QueryCommand({
                    TableName: DYNAMO_TABLE,
                    IndexName: "MentorIndex",
                    KeyConditionExpression: "mentorId = :mid",
                    ExpressionAttributeValues: { ":mid": filters.mentorId },
                })
            );
            bookings = res.Items || [];
        } else if (filters.menteeId) {
            const res = await ddb.send(
                new QueryCommand({
                    TableName: DYNAMO_TABLE,
                    IndexName: "MenteeIndex",
                    KeyConditionExpression: "menteeId = :mid",
                    ExpressionAttributeValues: { ":mid": filters.menteeId },
                })
            );
            bookings = res.Items || [];
        } else {
            const scanRes = await ddb.send(
                new ScanCommand({ TableName: DYNAMO_TABLE })
            );
            bookings = scanRes.Items || [];
        }
    } catch {
        // Fallback for local (no indexes)
        const scanRes = await ddb.send(
            new ScanCommand({
                TableName: DYNAMO_TABLE,
                FilterExpression:
                    "(:mId = :empty OR mentorId = :mId) AND (:meId = :empty OR menteeId = :meId) AND (:sId = :empty OR slotId = :sId)",
                ExpressionAttributeValues: {
                    ":mId": filters.mentorId || "EMPTY",
                    ":meId": filters.menteeId || "EMPTY",
                    ":sId": filters.slotId || "EMPTY",
                    ":empty": "EMPTY",
                },
            })
        );
        bookings = scanRes.Items || [];
    }

    // Sort newest first
    bookings.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

    return bookings;
};

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId) => {
    const res = await ddb.send(
        new ScanCommand({
            TableName: DYNAMO_TABLE,
            FilterExpression: "#id = :bid",
            ExpressionAttributeNames: { "#id": "_id" },
            ExpressionAttributeValues: { ":bid": bookingId },
        })
    );
    return res.Items?.[0] || null;
};

/**
 * Update booking (confirm, payment, etc.)
 */
export const updateBooking = async (bookingId, updateData) => {
    const updateExp = [];
    const names = {};
    const values = {};

    Object.entries(updateData).forEach(([key, val]) => {
        updateExp.push(`#${key} = :${key}`);
        names[`#${key}`] = key;
        values[`:${key}`] = val;
    });

    const res = await ddb.send(
        new UpdateCommand({
            TableName: DYNAMO_TABLE,
            Key: { _id: bookingId },
            UpdateExpression: `SET ${updateExp.join(", ")}`,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ReturnValues: "ALL_NEW",
        })
    );

    return res.Attributes;
};

/**
 * Delete booking
 */
export const deleteBooking = async (bookingId) => {
    await ddb.send(
        new DeleteCommand({
            TableName: DYNAMO_TABLE,
            Key: { _id: bookingId },
        })
    );
    return true;
};

// @ts-nocheck
import { ddb, TABLE_NAME } from "../db/dbClient.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

/**
 * Search mentors with optional filters and pagination
 */
export const searchMentors = async (filters: any) => {
    let mentors: any[] = [];
    let ExclusiveStartKey;

    // Get all mentor profiles
    do {
        const scanResult = await ddb.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                ExclusiveStartKey,
                FilterExpression: "SK = :sk",
                ExpressionAttributeValues: {
                    ":sk": "MENTORPROFILE",
                },
            })
        );

        if (scanResult.Items) mentors.push(...scanResult.Items);
        ExclusiveStartKey = scanResult.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    // For each mentor, get their user profile and attach userId object
    for (const mentor of mentors) {
        const userResult = await ddb.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: "#id = :idVal AND SK = :sk",
                ExpressionAttributeNames: {
                    "#id": "_id",
                },
                ExpressionAttributeValues: {
                    ":idVal": mentor._id,
                    ":sk": "PROFILE",
                },
            })
        );

        if (userResult.Items && userResult.Items.length > 0) {
            const user = userResult.Items[0];
            mentor.userId = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
            };
        } else {
            mentor.userId = undefined;
        }
    }

    // --- Apply filters (same as before) ---
    if (filters.domains) {
        const domainsArray = filters.domains
            .split(",")
            .map((d: string) => d.trim());
        mentors = mentors.filter((m) =>
            m.domains?.some((d: string) => domainsArray.includes(d))
        );
    }

    if (filters.exp) {
        mentors = mentors.filter(
            (m) => (m.yearsOfExperience ?? 0) >= Number(filters.exp)
        );
    }

    if (filters.badges) {
        const badgesArray = filters.badges
            .split(",")
            .map((b: string) => b.trim());
        mentors = mentors.filter((m) =>
            m.badges?.some((b: string) => badgesArray.includes(b))
        );
    }

    if (filters.designation) {
        const regex = new RegExp(filters.designation, "i");
        mentors = mentors.filter((m) => regex.test(m.designation ?? ""));
    }

    if (filters.hourlyRate) {
        mentors = mentors.filter(
            (m) => (m.hourlyRate ?? Infinity) <= Number(filters.hourlyRate)
        );
    }

    // --- Sort and paginate ---
    mentors.sort((a, b) => {
        if ((b.yearsOfExperience ?? 0) !== (a.yearsOfExperience ?? 0)) {
            return (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0);
        }
        return (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0);
    });

    const page = parseInt(filters.page) > 0 ? parseInt(filters.page) : 1;
    const size = parseInt(filters.size) > 0 ? parseInt(filters.size) : 10;
    const start = (page - 1) * size;
    const pagedMentors = mentors.slice(start, start + size);

    return {
        page,
        size,
        totalMentors: mentors.length,
        totalPages: Math.ceil(mentors.length / size),
        mentors: pagedMentors,
    };
};

/**
 * Get single mentor by user _id
 */
export const getMentorById = async (mentorId: string) => {
    let mentorProfile = null;
    let ExclusiveStartKey;

    // Find the mentor profile
    do {
        const scanResult = await ddb.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                ExclusiveStartKey,
                FilterExpression: "#id = :idVal AND SK = :sk",
                ExpressionAttributeNames: {
                    "#id": "_id",
                },
                ExpressionAttributeValues: {
                    ":idVal": mentorId,
                    ":sk": "MENTORPROFILE",
                },
            })
        );

        if (scanResult.Items && scanResult.Items.length > 0) {
            mentorProfile = scanResult.Items[0];
            break;
        }

        ExclusiveStartKey = scanResult.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    if (!mentorProfile) return null;

    // Get user profile for the same _id
    let userProfile = null;
    ExclusiveStartKey = undefined;

    do {
        const scanResult = await ddb.send(
            new ScanCommand({
                TableName: TABLE_NAME,
                ExclusiveStartKey,
                FilterExpression: "#id = :idVal AND SK = :sk",
                ExpressionAttributeNames: {
                    "#id": "_id",
                },
                ExpressionAttributeValues: {
                    ":idVal": mentorId,
                    ":sk": "PROFILE",
                },
            })
        );

        if (scanResult.Items && scanResult.Items.length > 0) {
            userProfile = scanResult.Items[0];
            break;
        }

        ExclusiveStartKey = scanResult.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return {
        ...mentorProfile,
        userId: userProfile
            ? {
                  _id: userProfile._id,
                  firstName: userProfile.firstName,
                  lastName: userProfile.lastName,
              }
            : undefined,
    };
};

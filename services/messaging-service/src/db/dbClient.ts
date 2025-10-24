import {
    DynamoDBClient,
    ListTablesCommand,
    CreateTableCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "local",
    endpoint: process.env.DYNAMO_ENDPOINT || "http://localhost:8000",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fake",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fake",
    },
});

export const ddb = DynamoDBDocumentClient.from(client);

// Table names
export const USER_TABLE = process.env.DYNAMO_TABLE || "Users";
export const CONVERSATION_TABLE =
    process.env.CONVERSATIONS_TABLE || "Conversations";
export const MESSAGE_TABLE = process.env.MESSAGE_TABLE || "Messages";

(async () => {
    const tables = await client.send(new ListTablesCommand({}));
    const existing = tables.TableNames || [];

    // Create Conversations table
    if (!existing.includes(CONVERSATION_TABLE)) {
        console.log("⚙️ Creating DynamoDB table: Conversations");
        await client.send(
            new CreateTableCommand({
                TableName: "Conversations",
                AttributeDefinitions: [
                    { AttributeName: "_id", AttributeType: "S" },
                ],
                KeySchema: [{ AttributeName: "_id", KeyType: "HASH" }],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            })
        );
        console.log("✅ Table Conversations created successfully");
    }

    // Create Messages table
    if (!existing.includes(MESSAGE_TABLE)) {
        console.log("⚙️ Creating DynamoDB table: Messages");
        await client.send(
            new CreateTableCommand({
                TableName: "Messages",
                AttributeDefinitions: [
                    { AttributeName: "_id", AttributeType: "S" },
                    { AttributeName: "conversationId", AttributeType: "S" },
                ],
                KeySchema: [{ AttributeName: "_id", KeyType: "HASH" }],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "ConversationIndex",
                        KeySchema: [
                            {
                                AttributeName: "conversationId",
                                KeyType: "HASH",
                            },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 5,
                            WriteCapacityUnits: 5,
                        },
                    },
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            })
        );
        console.log("✅ Table Messages created successfully");
    }

    console.log("✅ DynamoDB setup complete.");
})();

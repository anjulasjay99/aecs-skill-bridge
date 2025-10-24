import {
    DynamoDBClient,
    ListTablesCommand,
    CreateTableCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "local",
    endpoint: process.env.DYNAMO_ENDPOINT || "http://localhost:8000",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fake",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fake",
    },
});

export const ddb = DynamoDBDocumentClient.from(client);

// ✅ Table names
export const USER_TABLE = process.env.DYNAMO_TABLE || "Users";
export const CONVERSATION_TABLE =
    process.env.CONVERSATIONS_TABLE || "Conversations";
export const MESSAGE_TABLE = process.env.MESSAGES_TABLE || "Messages";

(async () => {
    const tables = await client.send(new ListTablesCommand({}));
    const existing = tables.TableNames || [];

    // Create Users table (if missing)
    if (!existing.includes(USER_TABLE)) {
        console.log(`⚙️ Creating DynamoDB table: ${USER_TABLE}`);
        await client.send(
            new CreateTableCommand({
                TableName: USER_TABLE,
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" },
                ],
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" },
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            })
        );
        console.log(`✅ Table ${USER_TABLE} created successfully`);
    }

    // Create Conversations table
    if (!existing.includes(CONVERSATION_TABLE)) {
        console.log(`⚙️ Creating DynamoDB table: ${CONVERSATION_TABLE}`);
        await client.send(
            new CreateTableCommand({
                TableName: CONVERSATION_TABLE,
                AttributeDefinitions: [
                    { AttributeName: "conversationId", AttributeType: "S" },
                ],
                KeySchema: [
                    { AttributeName: "conversationId", KeyType: "HASH" },
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            })
        );
        console.log(`✅ Table ${CONVERSATION_TABLE} created successfully`);
    }

    // Create Messages table
    if (!existing.includes(MESSAGE_TABLE)) {
        console.log(`⚙️ Creating DynamoDB table: ${MESSAGE_TABLE}`);
        await client.send(
            new CreateTableCommand({
                TableName: MESSAGE_TABLE,
                AttributeDefinitions: [
                    { AttributeName: "messageId", AttributeType: "S" },
                    { AttributeName: "conversationId", AttributeType: "S" },
                ],
                KeySchema: [{ AttributeName: "messageId", KeyType: "HASH" }],
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
        console.log(`✅ Table ${MESSAGE_TABLE} created successfully`);
    }

    console.log("✅ DynamoDB setup complete.");
})();

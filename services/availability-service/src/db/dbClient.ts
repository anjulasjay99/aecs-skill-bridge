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
export const TABLE_NAME = process.env.DYNAMO_TABLE || "Availability";

(async () => {
    const tables = await client.send(new ListTablesCommand({}));
    if (!tables.TableNames?.includes(TABLE_NAME)) {
        console.log(`⚙️ Creating DynamoDB table: ${TABLE_NAME}`);
        await client.send(
            new CreateTableCommand({
                TableName: "Availability",
                AttributeDefinitions: [
                    { AttributeName: "_id", AttributeType: "S" },
                    { AttributeName: "mentorId", AttributeType: "S" },
                ],
                KeySchema: [{ AttributeName: "_id", KeyType: "HASH" }],
                GlobalSecondaryIndexes: [
                    {
                        IndexName: "MentorIndex",
                        KeySchema: [
                            { AttributeName: "mentorId", KeyType: "HASH" },
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
        console.log(`✅ Table ${TABLE_NAME} created successfully`);
    } else {
        console.log(`✅ DynamoDB table ${TABLE_NAME} already exists`);
    }
})();

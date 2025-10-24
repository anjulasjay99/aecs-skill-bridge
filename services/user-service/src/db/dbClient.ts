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
export const TABLE_NAME = process.env.DYNAMO_TABLE || "Users";

(async () => {
    const tables = await client.send(new ListTablesCommand({}));
    if (!tables.TableNames?.includes(TABLE_NAME)) {
        console.log(`⚙️ Creating DynamoDB table: ${TABLE_NAME}`);
        await client.send(
            new CreateTableCommand({
                TableName: TABLE_NAME,
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
        console.log(`✅ Table ${TABLE_NAME} created successfully`);
    } else {
        console.log(`✅ DynamoDB table ${TABLE_NAME} already exists`);
    }
})();

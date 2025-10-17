import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandInput,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { UploadedFile } from "../types/UploadedFile.js";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
    region: process.env.REGION ?? "", // e.g., 'us-east-1'
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.SECRET_ACCESS_KEY ?? "",
    },
});

export async function uploadBase64File(
    base64: string,
    bucketName: string
): Promise<UploadedFile> {
    // Example: data:image/png;base64,iVBORw0KGgoAAAANS...
    const matches = base64.match(/^data:(.+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 string");
    }

    const contentType = matches[1]; // e.g., 'image/png'
    const fileData = Buffer.from(matches[2], "base64");
    const fileExtension = contentType.split("/")[1]; // e.g., 'png'

    const key = `uploads/${uuidv4()}.${fileExtension}`;

    const params: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: key,
        Body: fileData,
        ContentEncoding: "base64",
        ContentType: contentType,
        ACL: "public-read",
    };

    await s3.send(new PutObjectCommand(params));

    return {
        url: `https://${bucketName}.s3.ap-southeast-1.amazonaws.com/${key}`,
        fileType: contentType,
    };
}

export async function deleteS3File(bucketName: string, key: string) {
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key, // e.g., "uploads/1234.png"
    });

    try {
        await s3.send(command);
        console.log(`✅ Deleted ${key} from ${bucketName}`);
    } catch (err) {
        console.error("❌ Failed to delete:", err);
        throw err;
    }
}

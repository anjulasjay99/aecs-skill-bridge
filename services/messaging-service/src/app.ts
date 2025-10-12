import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import conversationRoutes from "./routes/conversationRoutes.js";
import http from "http";
import { initSocket } from "./socket.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.DB_NAME ?? "";

mongoose
    .connect(`${MONGO_URI}/${DB_NAME}`)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1); // Exit if the DB can't connect
    });

app.use("/conversations", conversationRoutes);

const server = http.createServer(app);
initSocket(server);

export default server;

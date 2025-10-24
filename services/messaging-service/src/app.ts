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

app.use("/conversations", conversationRoutes);

const server = http.createServer(app);
initSocket(server);

export default server;

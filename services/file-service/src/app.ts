import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fileRoutes from "./routes/fileRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(cors());

app.use("/files", fileRoutes);

export default app;

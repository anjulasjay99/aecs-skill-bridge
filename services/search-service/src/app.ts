import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import searchRoutes from "./routes/searchRoutes";

dotenv.config();

const app = express();
app.use(express.json());

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

app.use("/mentors", searchRoutes);

export default app;

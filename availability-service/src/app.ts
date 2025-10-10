import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import availabilityRoutes from "./routes/availabilityRoutes";

dotenv.config();

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI ?? "";

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1); // Exit if the DB can't connect
    });

app.use("/availability", availabilityRoutes);

export default app;

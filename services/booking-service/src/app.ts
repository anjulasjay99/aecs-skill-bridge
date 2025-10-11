import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bookingRoutes from "./routes/bookingRoutes";

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

// Routes
app.use("/bookings", bookingRoutes);

// Start server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Booking Service running on port ${PORT}`));

export default app;

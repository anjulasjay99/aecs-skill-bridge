import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bookingRoutes from "./routes/bookingRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/bookings", bookingRoutes);

// Start server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Booking Service running on port ${PORT}`));

export default app;

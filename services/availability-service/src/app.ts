import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/availability", availabilityRoutes);

export default app;

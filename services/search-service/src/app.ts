import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import searchRoutes from "./routes/searchRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/mentors", searchRoutes);

export default app;

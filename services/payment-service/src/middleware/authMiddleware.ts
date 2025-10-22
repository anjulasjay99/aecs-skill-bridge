import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../types/User.js";

export interface AuthRequest extends Request {
    user?: User;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];

    // Check if header exists and starts with "Bearer "
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res
            .status(401)
            .json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, "secret") as Record<string, User>;
        req.user = decoded.user;
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

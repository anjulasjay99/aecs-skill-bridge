import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "./config.js";
import { Socket } from "socket.io";

export interface AuthUser extends JwtPayload {
    sub?: string;
    email?: string;
    role?: string;
}

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (config.allowUnauthenticated) return next();

    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Missing token" });
        return;
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
        (req as any).user = payload;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function authSocket(socket: Socket, next: (err?: Error) => void): void {
    if (config.allowUnauthenticated) {
        (socket as any).user = { sub: "dev-user" };
        return next();
    }

    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing token"));

    try {
        const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
        (socket as any).user = payload;
        next();
    } catch (err) {
        next(new Error("Unauthorized"));
    }
}

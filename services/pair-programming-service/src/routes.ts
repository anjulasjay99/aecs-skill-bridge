import { Router, Request, Response } from "express";
import { authenticate } from "./auth.js";
import { config } from "./config.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: config.serviceName });
});

router.get(
    "/sessions/:sessionId/authorize",
    authenticate,
    (req: Request, res: Response) => {
        const { sessionId } = req.params;
        // TODO: verify via Booking Service
        res.json({ ok: true, sessionId });
    }
);

router.get(
    "/turn-credentials",
    authenticate,
    (_req: Request, res: Response) => {
        res.json({
            ttl: 600,
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
    }
);

export default router;

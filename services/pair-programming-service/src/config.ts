import "dotenv/config";

export const config = {
    port: process.env.PORT || 8080,
    corsOrigins: (process.env.CORS_ORIGINS || "").split(",").filter(Boolean),
    jwtSecret: process.env.JWT_SECRET || "supersecret",
    serviceName: process.env.SERVICE_NAME || "webrtc-signaling-service",
    allowUnauthenticated: process.env.ALLOW_UNAUTH === "true",
};

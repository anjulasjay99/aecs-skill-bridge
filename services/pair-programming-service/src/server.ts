import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes.js";
import { config } from "./config.js";
import { log } from "./logger.js";
import { createSignalingServer } from "./socket.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan("tiny"));
app.use(cors());

app.use("/api", routes);

const server = http.createServer(app);
createSignalingServer(server, config.corsOrigins);

server.listen(config.port, () => {
    log.info(`${config.serviceName} running on port ${config.port}`);
});

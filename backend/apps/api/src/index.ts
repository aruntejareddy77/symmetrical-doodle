import express from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import { config } from "@vizagops/config";
import { logger, requestLogger } from "@vizagops/logger";
import { globalErrorHandler } from "@vizagops/api";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import healthRoutes from "./modules/health/routes";
import complaintRoutes from "./modules/complaints/routes";
import auditRoutes from "./modules/audit/routes";
import authRoutes from "./modules/auth/routes";
import fieldTeamRoutes from "./modules/field-teams/routes";
import assignmentRoutes from "./modules/assignments/routes";
import sensorEventRoutes from "./modules/sensor-events/routes";
import matchingRoutes from "./modules/matching/routes";
import statusRoutes from "./modules/status/routes";
import notificationRoutes from "./modules/notifications/routes";
import analyticsRoutes from "./modules/analytics/routes";
import aiRoutes from "./modules/ai/routes";
import { initWebSocketServer } from "./ws";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);

// REST Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/field-teams", fieldTeamRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/sensor-events", sensorEventRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/status", statusRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/ai", aiRoutes);

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VizagOps Unify API",
      version: "1.0.0",
      description: "API Gateway for VizagOps Unify Platform",
    },
    servers: [{ url: "http://localhost:3000/api/v1" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/modules/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(globalErrorHandler);

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Server
initWebSocketServer(server);

const PORT = Number(process.env.PORT || config.PORT || 3000);
server.listen(PORT, "0.0.0.0", () => {
  logger.info({ message: "API Gateway started (HTTP + WebSocket)", port: PORT, env: config.NODE_ENV });
});

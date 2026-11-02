import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { pool } from "./db";
import { sendError } from "./http";
import { apiRouter } from "./routes";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to at least 32 characters");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const allowedOrigins = new Set(["http://localhost:3000"]);
if (siteUrl) {
  try {
    allowedOrigins.add(new URL(siteUrl).origin);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid URL");
  }
}

app.set("trust proxy", 1);
app.use((request, response, next) => {
  const origin = request.get("origin");
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) {
      sendError(response, 403, "CORS_ORIGIN_DENIED", "Origin is not allowed");
      return;
    }
    response.sendStatus(204);
    return;
  }
  if (origin && !allowedOrigins.has(origin)) {
    sendError(response, 403, "CORS_ORIGIN_DENIED", "Origin is not allowed");
    return;
  }
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1", apiRouter);
app.use((_request, response) => {
  sendError(response, 404, "NOT_FOUND", "API route not found");
});

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON");
    return;
  }
  if (error instanceof ZodError) {
    sendError(response, 400, "VALIDATION_ERROR", "Request validation failed", error.flatten());
    return;
  }
  console.error("Unhandled API error:", error);
  sendError(response, 500, "INTERNAL_ERROR", "An unexpected server error occurred");
};
app.use(errorHandler);

const server = app.listen(port, () => {
  console.info(`Hyderabad Paws API listening on port ${port}`);
});

function shutdown(signal: string): void {
  console.info(`Received ${signal}; shutting down API`);
  server.close((serverError) => {
    void pool.end().then(() => {
      if (serverError) {
        console.error("API server shutdown failed:", serverError);
        process.exitCode = 1;
      }
    }).catch((poolError: unknown) => {
      console.error("Database pool shutdown failed:", poolError);
      process.exitCode = 1;
    });
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

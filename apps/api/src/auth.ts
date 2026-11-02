import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { sendError } from "./http";

export const AUTH_COOKIE_NAME = "hyderabad_paws_admin";
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  path: "/api/v1",
};

export type AdminIdentity = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      admin?: AdminIdentity;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters");
  }
  return secret;
}

export function signAdminToken(admin: AdminIdentity): string {
  return jwt.sign({ email: admin.email, role: "admin" }, getJwtSecret(), {
    subject: admin.id,
    expiresIn: "8h",
    issuer: "hyderabad-paws-api",
    audience: "hyderabad-paws-admin",
  });
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const token = request.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== "string" || token.length === 0) {
    sendError(response, 401, "UNAUTHORIZED", "Admin authentication is required");
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: "hyderabad-paws-api",
      audience: "hyderabad-paws-admin",
    });
    if (
      typeof payload === "string" ||
      typeof (payload as JwtPayload).sub !== "string" ||
      typeof (payload as JwtPayload).email !== "string" ||
      (payload as JwtPayload).role !== "admin"
    ) {
      sendError(response, 401, "UNAUTHORIZED", "Admin session is invalid");
      return;
    }

    request.admin = {
      id: (payload as JwtPayload).sub as string,
      email: (payload as JwtPayload).email as string,
    };
    next();
  } catch {
    sendError(response, 401, "UNAUTHORIZED", "Admin session is invalid or expired");
  }
}

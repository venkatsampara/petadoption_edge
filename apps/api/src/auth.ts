import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { sendError } from "./http";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "./db";
import { caretakerSessions, caretakerUsers } from "./db/schema";

export const AUTH_COOKIE_NAME = "hyderabad_paws_admin";
export const CARETAKER_COOKIE_NAME = "hyderabad_paws_caretaker";
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
      caretaker?: AdminIdentity;
    }
  }
}

export function hashSession(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCaretakerSession(id: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(caretakerSessions).values({
    id: hashSession(token), caretakerId: id,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
  });
  return token;
}

export function requireCaretaker(request: Request, response: Response, next: NextFunction): void {
  const token = request.cookies?.[CARETAKER_COOKIE_NAME];
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    sendError(response, 401, "UNAUTHORIZED", "Caretaker authentication is required");
    return;
  }
  void db.select({ id: caretakerUsers.id, email: caretakerUsers.email })
    .from(caretakerSessions)
    .innerJoin(caretakerUsers, eq(caretakerSessions.caretakerId, caretakerUsers.id))
    .where(and(eq(caretakerSessions.id, hashSession(token)), gt(caretakerSessions.expiresAt, new Date())))
    .limit(1).then(([user]) => {
      if (!user) {
        sendError(response, 401, "UNAUTHORIZED", "Caretaker session is invalid or expired");
        return;
      }
      request.caretaker = user;
      next();
    }).catch(next);
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

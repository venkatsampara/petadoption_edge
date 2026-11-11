import {
  applicationInputSchema,
  applicationUpdateSchema,
  loginInputSchema,
  petInputSchema,
  petListQuerySchema,
  petUpdateSchema,
  recommendationQuerySchema,
  volunteerInputSchema,
  caretakerCredentialsSchema,
  caretakerPetEditSchema,
  caretakerAvailabilitySchema,
  petSubmissionSchema,
  submissionReviewSchema,
  submissionLinkSchema,
  petEditReviewSchema,
  caretakerClaimSchema,
  claimReviewSchema,
} from "@hyderabad-paws/shared";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { applications, adminUsers, pets, caretakerUsers, caretakerSessions, petOwners, petSubmissions, petEdits, caretakerClaims } from "./db/schema";
import { db } from "./db";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  requireAdmin,
  signAdminToken,
  CARETAKER_COOKIE_NAME,
  createCaretakerSession,
  hashSession,
  requireCaretaker,
} from "./auth";
import { asyncHandler, sendData, sendError } from "./http";

export const apiRouter = Router();
const adminRouter = Router();
const authRouter = Router();
const caretakerRouter = Router();
caretakerRouter.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });

const publicLimiter = rateLimit({
  windowMs: 60_000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false,
  handler: (_request, response) => sendError(response, 429, "RATE_LIMITED", "Too many requests. Please try again later."),
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false,
  handler: (_request, response) => sendError(response, 429, "RATE_LIMITED", "Too many authentication attempts. Please try again later."),
});

function validImages(images: string[] | undefined): boolean {
  if (!images?.length) return true;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !/^[a-zA-Z0-9_-]+$/.test(cloudName)) return false;
  return images.every((image) => {
    try {
      const url = new URL(image);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com" &&
        !url.username && !url.password && !url.port && !url.search && !url.hash &&
        url.pathname.startsWith(`/${cloudName}/image/upload/`) &&
        !/%2f|%5c|%2e/i.test(url.pathname);
    } catch { return false; }
  });
}

const applicationLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_request, response) => {
    sendError(response, 429, "RATE_LIMITED", "Too many applications. Please try again in a minute.");
  },
});

const volunteerLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_request, response) => {
    sendError(response, 429, "RATE_LIMITED", "Too many volunteer submissions. Please try again in a minute.");
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

apiRouter.get(
  "/health",
  asyncHandler(async (_request, response) => {
    await db.execute(sql`select 1`);
    sendData(response, { status: "ok", db: true });
  }),
);

apiRouter.get(
  "/pets",
  asyncHandler(async (request, response) => {
    response.set("Cache-Control", "no-store");
    const parsed = petListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid pet filters", parsed.error.flatten());
      return;
    }

    const { species, area, size, breed, gender, minAgeMonths, maxAgeMonths, status, page, limit } = parsed.data;
    const filters = [eq(pets.status, status)];
    if (species) filters.push(eq(pets.species, species));
    if (area) filters.push(eq(pets.area, area));
    if (size) filters.push(eq(pets.size, size));
    if (breed) {
      const breeds = breed.split(",").map((value) => value.trim()).filter(Boolean);
      filters.push(breeds.length === 1 ? eq(pets.breed, breeds[0]) : inArray(pets.breed, breeds));
    }
    if (gender) filters.push(eq(pets.gender, gender));
    if (minAgeMonths !== undefined) filters.push(gte(pets.ageMonths, minAgeMonths));
    if (maxAgeMonths !== undefined) filters.push(lte(pets.ageMonths, maxAgeMonths));

    const where = and(...filters);
    const [items, count] = await Promise.all([
      db
        .select()
        .from(pets)
        .where(where)
        .orderBy(desc(pets.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)::int` }).from(pets).where(where),
    ]);

    sendData(response, {
      items,
      pagination: {
        page,
        limit,
        total: count[0]?.count ?? 0,
        totalPages: Math.ceil((count[0]?.count ?? 0) / limit),
      },
    });
  }),
);

apiRouter.get(
  "/pets/:slug/recommendations",
  asyncHandler(async (request, response) => {
    response.set("Cache-Control", "no-store");
    const parsed = recommendationQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid recommendation filters", parsed.error.flatten());
      return;
    }

    const [currentPet] = await db.select({ id: pets.id, species: pets.species })
      .from(pets).where(and(eq(pets.slug, request.params.slug), ne(pets.status, "hidden"))).limit(1);
    if (!currentPet) {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }

    const { species, sizes, area } = parsed.data;
    const matchingSpecies = species.length ? species : [currentPet.species];
    const popularity = sql<number>`(select count(*)::int from ${applications} where ${applications.petId} = ${pets.id})`;
    const relevance = sql<number>`
      (case when ${area ?? null}::text is not null and lower(${pets.area}) = lower(${area ?? null}::text) then 2 else 0 end)
      + (case when ${sizes.length > 0 ? inArray(pets.size, sizes) : sql`false`} then 1 else 0 end)
    `;
    const matches = await db.select({ pet: pets, popularity })
      .from(pets)
      .where(and(eq(pets.status, "available"), ne(pets.id, currentPet.id), inArray(pets.species, matchingSpecies)))
      .orderBy(desc(relevance), desc(popularity), desc(pets.createdAt), pets.id)
      .limit(5);

    matches.sort((a, b) => b.popularity - a.popularity);
    sendData(response, matches.map(({ pet }) => pet));
  }),
);

apiRouter.get(
  "/pets/:slug",
  asyncHandler(async (request, response) => {
    response.set("Cache-Control", "no-store");
    const [pet] = await db.select().from(pets).where(and(eq(pets.slug, request.params.slug), ne(pets.status, "hidden"))).limit(1);
    if (!pet) {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }
    sendData(response, pet);
  }),
);

apiRouter.post(
  "/applications",
  applicationLimiter,
  asyncHandler(async (request, response) => {
    const parsed = applicationInputSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid application", parsed.error.flatten());
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [pet] = await tx.select({ id: pets.id, status: pets.status }).from(pets)
        .where(eq(pets.id, parsed.data.petId)).for("update");
      if (!pet || pet.status === "hidden") return { error: "not_found" as const };
      if (pet.status !== "available") return { error: "unavailable" as const };
      const [application] = await tx.insert(applications).values(parsed.data).returning();
      return { application };
    });
    if (result.error === "not_found") {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }
    if (result.error === "unavailable") {
      sendError(response, 409, "PET_UNAVAILABLE", "Applications are only accepted for available pets");
      return;
    }
    sendData(response, result.application, 201);
  }),
);

apiRouter.post(
  "/volunteer",
  volunteerLimiter,
  asyncHandler(async (request, response) => {
    const parsed = volunteerInputSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid volunteer interest form", parsed.error.flatten());
      return;
    }

    const [submission] = await db
      .insert(applications)
      .values({
        petId: null,
        applicantName: parsed.data.applicantName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        area: parsed.data.area,
        message: `[Volunteer interest] ${parsed.data.message}`,
        housingType: parsed.data.housingType,
      })
      .returning({ id: applications.id, createdAt: applications.createdAt });
    sendData(response, submission, 201);
  }),
);

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (request, response) => {
    const parsed = loginInputSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid login details", parsed.error.flatten());
      return;
    }

    const username = parsed.data.username.toLowerCase();
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, username))
      .limit(1);
    const passwordMatches = admin
      ? await bcrypt.compare(parsed.data.password, admin.passwordHash)
      : false;
    if (!admin || !passwordMatches) {
      sendError(response, 401, "INVALID_CREDENTIALS", "Username or password is incorrect");
      return;
    }

    const token = signAdminToken({ id: admin.id, email: admin.email });
    response.cookie(AUTH_COOKIE_NAME, token, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 8 * 60 * 60 * 1000,
    });
    sendData(response, { id: admin.id, email: admin.email });
  }),
);

authRouter.post("/logout", (_request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
  sendData(response, { loggedOut: true });
});

authRouter.get("/me", requireAdmin, (request, response) => {
  sendData(response, request.admin);
});

adminRouter.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
adminRouter.use(requireAdmin);

adminRouter.get(
  "/pets",
  asyncHandler(async (_request, response) => {
    const items = await db.select().from(pets).orderBy(desc(pets.createdAt));
    sendData(response, items);
  }),
);

adminRouter.post(
  "/pets",
  asyncHandler(async (request, response) => {
    const parsed = petInputSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid pet details", parsed.error.flatten());
      return;
    }

    const [pet] = await db
      .insert(pets)
      .values({
        ...parsed.data,
        breed: parsed.data.breed ?? null,
        ageMonths: parsed.data.ageMonths ?? null,
        gender: parsed.data.gender ?? null,
        size: parsed.data.size ?? null,
      })
      .returning();
    sendData(response, pet, 201);
  }),
);

adminRouter.patch(
  "/pets/:id",
  asyncHandler(async (request, response) => {
    const parsedId = parseUuid(request.params.id);
    if (!parsedId) {
      sendError(response, 400, "VALIDATION_ERROR", "Pet ID must be a UUID");
      return;
    }
    const parsed = petUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid pet update", parsed.error.flatten());
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select({ status: pets.status }).from(pets).where(eq(pets.id, parsedId)).for("update");
      if (!current) return { error: "not_found" as const };
      if (current.status === "hidden" && parsed.data.status !== undefined && parsed.data.status !== "hidden") {
        return { error: "hidden" as const };
      }
      if (current.status === "adopted" && parsed.data.status !== undefined && parsed.data.status !== "adopted") {
        const [owner] = await tx.select({ petId: petOwners.petId }).from(petOwners).where(eq(petOwners.petId, parsedId));
        if (owner) return { error: "republish" as const };
      }
      const [pet] = await tx.update(pets).set({
        ...parsed.data,
        updatedAt: sql`greatest(clock_timestamp(), ${pets.updatedAt} + interval '1 millisecond')`,
      }).where(eq(pets.id, parsedId)).returning();
      return { pet };
    });
    if (result.error === "not_found") {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }
    if (result.error === "hidden") {
      sendError(response, 409, "PET_HIDDEN", "A hidden pet can only be republished through the republish workflow");
      return;
    }
    if (result.error === "republish") {
      sendError(response, 409, "REVIEW_REQUIRED", "A caretaker-managed adopted pet can only be republished through the republish workflow");
      return;
    }
    sendData(response, result.pet);
  }),
);

adminRouter.delete(
  "/pets/:id",
  asyncHandler(async (request, response) => {
    const parsedId = parseUuid(request.params.id);
    if (!parsedId) {
      sendError(response, 400, "VALIDATION_ERROR", "Pet ID must be a UUID");
      return;
    }

    const [deleted] = await db.delete(pets).where(eq(pets.id, parsedId)).returning({ id: pets.id });
    if (!deleted) {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }
    sendData(response, { id: deleted.id, deleted: true });
  }),
);

adminRouter.get(
  "/applications",
  asyncHandler(async (_request, response) => {
    const items = await db
      .select({
        id: applications.id,
        petId: applications.petId,
        applicantName: applications.applicantName,
        email: applications.email,
        phone: applications.phone,
        area: applications.area,
        message: applications.message,
        housingType: applications.housingType,
        status: applications.status,
        createdAt: applications.createdAt,
        pet: {
          id: pets.id,
          slug: pets.slug,
          name: pets.name,
        },
      })
      .from(applications)
      .leftJoin(pets, eq(applications.petId, pets.id))
      .orderBy(desc(applications.createdAt));
    sendData(response, items);
  }),
);

adminRouter.patch(
  "/applications/:id",
  asyncHandler(async (request, response) => {
    const parsedId = parseUuid(request.params.id);
    if (!parsedId) {
      sendError(response, 400, "VALIDATION_ERROR", "Application ID must be a UUID");
      return;
    }
    if (!isRecord(request.body)) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid application update");
      return;
    }
    const parsed = applicationUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid application status", parsed.error.flatten());
      return;
    }

    const [application] = await db
      .update(applications)
      .set(parsed.data)
      .where(eq(applications.id, parsedId))
      .returning();
    if (!application) {
      sendError(response, 404, "NOT_FOUND", "Application not found");
      return;
    }
    sendData(response, application);
  }),
);

apiRouter.post("/pet-submissions", publicLimiter, asyncHandler(async (request, response) => {
  const details = petSubmissionSchema.parse(request.body);
  if (!validImages(details.images)) {
    sendError(response, 400, "VALIDATION_ERROR", "Images must belong to the configured Cloudinary cloud");
    return;
  }
  const [submission] = await db.insert(petSubmissions).values({ details }).returning({ id: petSubmissions.id });
  sendData(response, submission, 201);
}));

caretakerRouter.post("/register", loginLimiter, asyncHandler(async (request, response) => {
  const { email, password } = caretakerCredentialsSchema.parse(request.body);
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(caretakerUsers).values({ email, passwordHash })
    .onConflictDoNothing().returning({ id: caretakerUsers.id, email: caretakerUsers.email });
  if (!user) {
    sendError(response, 409, "ACCOUNT_EXISTS", "An account with this email already exists");
    return;
  }
  const token = await createCaretakerSession(user.id);
  response.cookie(CARETAKER_COOKIE_NAME, token, { ...AUTH_COOKIE_OPTIONS, maxAge: 8 * 60 * 60 * 1000 });
  sendData(response, user, 201);
}));

caretakerRouter.post("/login", loginLimiter, asyncHandler(async (request, response) => {
  const { email, password } = caretakerCredentialsSchema.parse(request.body);
  const [user] = await db.select().from(caretakerUsers).where(eq(caretakerUsers.email, email)).limit(1);
  const matches = await bcrypt.compare(password, user?.passwordHash ?? "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxWPL.DROQ7oU3OMQN5KJypK5dK");
  if (!user || !matches) {
    sendError(response, 401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    return;
  }
  const token = await createCaretakerSession(user.id);
  response.cookie(CARETAKER_COOKIE_NAME, token, { ...AUTH_COOKIE_OPTIONS, maxAge: 8 * 60 * 60 * 1000 });
  sendData(response, { id: user.id, email: user.email });
}));

caretakerRouter.post("/logout", asyncHandler(async (request, response) => {
  const token = request.cookies?.[CARETAKER_COOKIE_NAME];
  if (typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    await db.delete(caretakerSessions).where(eq(caretakerSessions.id, hashSession(token)));
  }
  response.clearCookie(CARETAKER_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
  sendData(response, { loggedOut: true });
}));
caretakerRouter.use(requireCaretaker);
caretakerRouter.get("/me", (request, response) => sendData(response, request.caretaker));
caretakerRouter.get("/pets", asyncHandler(async (request, response) => {
  const rows = await db.select({ pet: pets }).from(pets)
    .innerJoin(petOwners, eq(petOwners.petId, pets.id))
    .where(eq(petOwners.caretakerId, request.caretaker!.id)).orderBy(desc(pets.createdAt));
  sendData(response, rows.map((row) => row.pet));
}));
caretakerRouter.get("/applications", asyncHandler(async (request, response) => {
  const rows = await db.select({ application: applications }).from(applications)
    .innerJoin(petOwners, eq(petOwners.petId, applications.petId))
    .where(eq(petOwners.caretakerId, request.caretaker!.id)).orderBy(desc(applications.createdAt));
  sendData(response, rows.map((row) => row.application));
}));
caretakerRouter.get("/pet-edits", asyncHandler(async (request, response) => {
  const rows = await db.select({
    id: petEdits.id, petId: petEdits.petId, status: petEdits.status,
    reviewNote: petEdits.reviewNote, createdAt: petEdits.createdAt,
  }).from(petEdits).innerJoin(petOwners, eq(petOwners.petId, petEdits.petId))
    .where(and(eq(petOwners.caretakerId, request.caretaker!.id), eq(petEdits.caretakerId, request.caretaker!.id)))
    .orderBy(desc(petEdits.createdAt));
  sendData(response, rows);
}));
caretakerRouter.get("/submissions", asyncHandler(async (request, response) => {
  const rows = await db.select({
    id: petSubmissions.id, status: petSubmissions.status, reviewNote: petSubmissions.reviewNote,
    petId: petSubmissions.petId, createdAt: petSubmissions.createdAt,
  }).from(petSubmissions).where(eq(petSubmissions.caretakerId, request.caretaker!.id))
    .orderBy(desc(petSubmissions.createdAt));
  sendData(response, rows);
}));
caretakerRouter.get("/claims", asyncHandler(async (request, response) => {
  const rows = await db.select({
    id: caretakerClaims.id, submissionId: caretakerClaims.submissionId, status: caretakerClaims.status,
    reviewNote: caretakerClaims.reviewNote, createdAt: caretakerClaims.createdAt,
  }).from(caretakerClaims).where(eq(caretakerClaims.caretakerId, request.caretaker!.id))
    .orderBy(desc(caretakerClaims.createdAt));
  sendData(response, rows);
}));
caretakerRouter.post("/claims", publicLimiter, asyncHandler(async (request, response) => {
  const { submissionId } = caretakerClaimSchema.parse(request.body);
  const result = await db.transaction(async (tx) => {
    const [submission] = await tx.select({ id: petSubmissions.id }).from(petSubmissions)
      .where(eq(petSubmissions.id, submissionId)).for("update");
    if (!submission) return { error: "not_found" as const };
    const [existing] = await tx.select({ id: caretakerClaims.id }).from(caretakerClaims)
      .where(and(eq(caretakerClaims.submissionId, submissionId), eq(caretakerClaims.caretakerId, request.caretaker!.id), eq(caretakerClaims.status, "pending")));
    if (existing) return { error: "conflict" as const };
    const [claim] = await tx.insert(caretakerClaims).values({ submissionId, caretakerId: request.caretaker!.id })
      .returning({ id: caretakerClaims.id });
    return { claim };
  });
  if (result.error === "not_found") { sendError(response, 404, "NOT_FOUND", "Submission not found"); return; }
  if (result.error === "conflict") { sendError(response, 409, "CLAIM_PENDING", "A claim is already pending"); return; }
  sendData(response, result.claim, 201);
}));

caretakerRouter.post("/pets/:id/edits", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Pet ID must be a UUID"); return; }
  const details = caretakerPetEditSchema.parse(request.body);
  if (!validImages(details.images)) {
    sendError(response, 400, "VALIDATION_ERROR", "Images must belong to the configured Cloudinary cloud"); return;
  }
  const result = await db.transaction(async (tx) => {
    const [pet] = await tx.select({ id: pets.id, updatedAt: pets.updatedAt }).from(pets)
      .where(eq(pets.id, id)).for("update");
    if (!pet) return null;
    const [owner] = await tx.select({ petId: petOwners.petId }).from(petOwners)
      .where(and(eq(petOwners.petId, id), eq(petOwners.caretakerId, request.caretaker!.id)));
    if (!owner) return null;
    const [edit] = await tx.insert(petEdits).values({ petId: id, caretakerId: request.caretaker!.id, details, baseUpdatedAt: pet.updatedAt })
      .returning({ id: petEdits.id });
    return edit;
  });
  if (!result) { sendError(response, 404, "NOT_FOUND", "Pet not found"); return; }
  sendData(response, result, 201);
}));

caretakerRouter.post("/pets/:id/availability", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Pet ID must be a UUID"); return; }
  const { status } = caretakerAvailabilitySchema.parse(request.body);
  const result = await db.transaction(async (tx) => {
    const [pet] = await tx.select({ status: pets.status, updatedAt: pets.updatedAt }).from(pets)
      .where(eq(pets.id, id)).for("update");
    if (!pet) return "not_found";
    const [owner] = await tx.select({ petId: petOwners.petId }).from(petOwners)
      .where(and(eq(petOwners.petId, id), eq(petOwners.caretakerId, request.caretaker!.id)));
    if (!owner) return "not_found";
    if (status === "request_republish") {
      if (pet.status !== "hidden" && pet.status !== "adopted") return "conflict";
      const [existing] = await tx.select({ id: petEdits.id }).from(petEdits)
        .where(and(eq(petEdits.petId, id), eq(petEdits.kind, "republish"), eq(petEdits.status, "pending")));
      if (existing) return "conflict";
      await tx.insert(petEdits).values({ petId: id, caretakerId: request.caretaker!.id, kind: "republish", details: {}, baseUpdatedAt: pet.updatedAt });
    } else {
      if (pet.status === "hidden" && status === "adopted") return "conflict";
      if (pet.status === status) return "ok";
      await tx.update(pets).set({ status, updatedAt: sql`greatest(clock_timestamp(), ${pets.updatedAt} + interval '1 millisecond')` }).where(eq(pets.id, id));
      await tx.update(petEdits).set({
        status: "rejected", reviewNote: "Availability changed", reviewedAt: new Date(),
      }).where(and(eq(petEdits.petId, id), eq(petEdits.kind, "republish"), eq(petEdits.status, "pending")));
    }
    return "ok";
  });
  if (result === "not_found") { sendError(response, 404, "NOT_FOUND", "Pet not found"); return; }
  if (result === "conflict") { sendError(response, 409, "INVALID_STATE", "Availability change is not allowed"); return; }
  sendData(response, { id, status });
}));

adminRouter.get("/submissions", asyncHandler(async (_request, response) => {
  sendData(response, await db.select().from(petSubmissions).orderBy(desc(petSubmissions.createdAt)));
}));
adminRouter.delete("/submissions/:id", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Submission ID must be a UUID"); return; }
  const [deleted] = await db.delete(petSubmissions).where(eq(petSubmissions.id, id)).returning({ id: petSubmissions.id });
  if (!deleted) { sendError(response, 404, "NOT_FOUND", "Submission not found"); return; }
  sendData(response, { id, deleted: true });
}));
adminRouter.get("/claims", asyncHandler(async (_request, response) => {
  const rows = await db.select({
    id: caretakerClaims.id, submissionId: caretakerClaims.submissionId, caretakerId: caretakerClaims.caretakerId,
    email: caretakerUsers.email, status: caretakerClaims.status, reviewNote: caretakerClaims.reviewNote,
    reviewedAt: caretakerClaims.reviewedAt, reviewedBy: caretakerClaims.reviewedBy, createdAt: caretakerClaims.createdAt,
  }).from(caretakerClaims).innerJoin(caretakerUsers, eq(caretakerUsers.id, caretakerClaims.caretakerId))
    .orderBy(desc(caretakerClaims.createdAt));
  sendData(response, rows);
}));
adminRouter.post("/claims/:id/review", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Claim ID must be a UUID"); return; }
  const { decision, note } = claimReviewSchema.parse(request.body);
  const status = decision === "resolve" ? "resolved" : "rejected";
  const [claim] = await db.update(caretakerClaims).set({
    status, reviewNote: note ?? null, reviewedAt: new Date(), reviewedBy: request.admin!.id,
  }).where(and(eq(caretakerClaims.id, id), eq(caretakerClaims.status, "pending")))
    .returning({ id: caretakerClaims.id, status: caretakerClaims.status });
  if (!claim) { sendError(response, 404, "NOT_FOUND", "Pending claim not found"); return; }
  sendData(response, claim);
}));
adminRouter.post("/submissions/:id/review", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Submission ID must be a UUID"); return; }
  const { decision, note } = submissionReviewSchema.parse(request.body);
  const result = await db.transaction(async (tx) => {
    const [submission] = await tx.select().from(petSubmissions).where(eq(petSubmissions.id, id)).for("update");
    if (!submission) return { error: "not_found" as const };
    if (submission.status !== "pending" && submission.status !== "clarification") return { error: "conflict" as const };
    let petId = submission.petId;
    if (decision === "approve") {
      const { contactName: _contact, email: _email, phone: _phone, whatsappConsent, ...details } = submission.details;
      if (!validImages(details.images)) return { error: "images" as const };
      const [pet] = await tx.insert(pets).values({
        ...details, slug: `pet-${randomUUID()}`, whatsappNumber: whatsappConsent ? details.whatsappNumber : null,
      }).returning({ id: pets.id });
      petId = pet.id;
      if (submission.caretakerId) await tx.insert(petOwners).values({ petId, caretakerId: submission.caretakerId });
    }
    const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "clarification";
    await tx.update(petSubmissions).set({ status, petId, reviewNote: note ?? null, reviewedAt: new Date(), reviewedBy: request.admin!.id }).where(eq(petSubmissions.id, id));
    return { id, status, petId };
  });
  if (result.error === "not_found") { sendError(response, 404, "NOT_FOUND", "Submission not found"); return; }
  if (result.error === "conflict") { sendError(response, 409, "ALREADY_REVIEWED", "Submission has already been reviewed"); return; }
  if (result.error === "images") { sendError(response, 409, "INVALID_IMAGES", "Submission images do not match the configured Cloudinary cloud"); return; }
  sendData(response, result);
}));

adminRouter.post("/submissions/:id/link", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Submission ID must be a UUID"); return; }
  const { email } = submissionLinkSchema.parse(request.body);
  const result = await db.transaction(async (tx) => {
    const [submission] = await tx.select().from(petSubmissions).where(eq(petSubmissions.id, id)).for("update");
    if (!submission) return "not_found";
    const [user] = await tx.select({ id: caretakerUsers.id }).from(caretakerUsers).where(eq(caretakerUsers.email, email));
    if (!user) return "not_found";
    if (submission.petId) {
      await tx.select({ id: pets.id }).from(pets).where(eq(pets.id, submission.petId)).for("update");
      const [existing] = await tx.select().from(petOwners).where(eq(petOwners.petId, submission.petId));
      if (existing && existing.caretakerId !== user.id) {
        await tx.update(petEdits).set({
          status: "rejected", reviewNote: "Ownership reassigned", reviewedAt: new Date(), reviewedBy: request.admin!.id,
        }).where(and(eq(petEdits.petId, submission.petId), eq(petEdits.caretakerId, existing.caretakerId), eq(petEdits.status, "pending")));
        await tx.update(petOwners).set({ caretakerId: user.id }).where(eq(petOwners.petId, submission.petId));
        await tx.update(pets).set({ updatedAt: sql`greatest(clock_timestamp(), ${pets.updatedAt} + interval '1 millisecond')` })
          .where(eq(pets.id, submission.petId));
      } else if (!existing) {
        await tx.insert(petOwners).values({ petId: submission.petId, caretakerId: user.id });
      }
    }
    await tx.update(petSubmissions).set({ caretakerId: user.id }).where(eq(petSubmissions.id, id));
    return "ok";
  });
  if (result === "not_found") { sendError(response, 404, "NOT_FOUND", "Submission or caretaker not found"); return; }
  sendData(response, { id, email });
}));

adminRouter.get("/pet-edits", asyncHandler(async (_request, response) => {
  sendData(response, await db.select().from(petEdits).orderBy(desc(petEdits.createdAt)));
}));
adminRouter.post("/pet-edits/:id/review", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Edit ID must be a UUID"); return; }
  const { decision, note } = petEditReviewSchema.parse(request.body);
  const result = await db.transaction(async (tx) => {
    const [reference] = await tx.select({ petId: petEdits.petId }).from(petEdits).where(eq(petEdits.id, id));
    if (!reference) return "not_found";
    const [pet] = await tx.select({ status: pets.status, updatedAt: pets.updatedAt }).from(pets)
      .where(eq(pets.id, reference.petId)).for("update");
    if (!pet) return "conflict";
    const [edit] = await tx.select().from(petEdits).where(eq(petEdits.id, id)).for("update");
    if (!edit) return "not_found";
    if (edit.status !== "pending") return "conflict";
    const [owner] = await tx.select({ petId: petOwners.petId }).from(petOwners)
      .where(and(eq(petOwners.petId, edit.petId), eq(petOwners.caretakerId, edit.caretakerId)));
    if (!owner) return "conflict";
    if (decision === "approve") {
      if (edit.baseUpdatedAt && edit.baseUpdatedAt.getTime() !== pet.updatedAt.getTime()) return "conflict";
      if (edit.kind === "republish") {
        if (pet.status !== "hidden" && pet.status !== "adopted") return "conflict";
      } else {
        const { whatsappConsent, whatsappNumber, ...details } = edit.details;
        if (!validImages(details.images)) return "images";
        await tx.update(pets).set({
          ...details,
          ...(whatsappConsent === undefined && whatsappNumber === undefined ? {} : { whatsappNumber: whatsappConsent ? whatsappNumber : null }),
          updatedAt: sql`greatest(clock_timestamp(), ${pets.updatedAt} + interval '1 millisecond')`,
        }).where(eq(pets.id, edit.petId));
      }
    }
    await tx.update(petEdits).set({ status: decision === "approve" ? "approved" : "rejected", reviewNote: note ?? null, reviewedAt: new Date(), reviewedBy: request.admin!.id }).where(eq(petEdits.id, id));
    return "ok";
  });
  if (result === "not_found") { sendError(response, 404, "NOT_FOUND", "Edit not found"); return; }
  if (result === "conflict") { sendError(response, 409, "INVALID_STATE", "Edit cannot be reviewed in its current state"); return; }
  if (result === "images") { sendError(response, 409, "INVALID_IMAGES", "Edit images do not match the configured Cloudinary cloud"); return; }
  sendData(response, { id, status: decision === "approve" ? "approved" : "rejected" });
}));

adminRouter.post("/pets/:id/republish", asyncHandler(async (request, response) => {
  const id = parseUuid(request.params.id);
  if (!id) { sendError(response, 400, "VALIDATION_ERROR", "Pet ID must be a UUID"); return; }
  if (!isRecord(request.body) || Object.keys(request.body).length !== 0) {
    sendError(response, 400, "VALIDATION_ERROR", "Request body must be an empty object"); return;
  }
  const result = await db.transaction(async (tx) => {
    const [pet] = await tx.select({ status: pets.status, updatedAt: pets.updatedAt }).from(pets)
      .where(eq(pets.id, id)).for("update");
    if (!pet) return "not_found";
    if (pet.status !== "hidden" && pet.status !== "adopted") return "conflict";
    const [owner] = await tx.select({ caretakerId: petOwners.caretakerId }).from(petOwners).where(eq(petOwners.petId, id));
    if (!owner) return "conflict";
    const requests = await tx.select({ baseUpdatedAt: petEdits.baseUpdatedAt }).from(petEdits)
      .where(and(eq(petEdits.petId, id), eq(petEdits.caretakerId, owner.caretakerId),
        eq(petEdits.kind, "republish"), eq(petEdits.status, "approved")))
      .orderBy(desc(petEdits.reviewedAt));
    if (!requests.some((item) => item.baseUpdatedAt?.getTime() === pet.updatedAt.getTime())) return "conflict";
    await tx.update(pets).set({ status: "available", updatedAt: sql`greatest(clock_timestamp(), ${pets.updatedAt} + interval '1 millisecond')` })
      .where(eq(pets.id, id));
    return "ok";
  });
  if (result === "not_found") { sendError(response, 404, "NOT_FOUND", "Pet not found"); return; }
  if (result === "conflict") { sendError(response, 409, "INVALID_STATE", "A current approved republish request is required"); return; }
  sendData(response, { id, status: "available" });
}));

function parseUuid(value: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/caretaker", caretakerRouter);

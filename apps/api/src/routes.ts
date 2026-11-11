import {
  applicationInputSchema,
  applicationUpdateSchema,
  loginInputSchema,
  petInputSchema,
  petListQuerySchema,
  petUpdateSchema,
  recommendationQuerySchema,
  volunteerInputSchema,
} from "@hyderabad-paws/shared";
import bcrypt from "bcryptjs";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { applications, adminUsers, pets } from "./db/schema";
import { db } from "./db";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  requireAdmin,
  signAdminToken,
} from "./auth";
import { asyncHandler, sendData, sendError } from "./http";

export const apiRouter = Router();
const adminRouter = Router();
const authRouter = Router();

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
    const parsed = recommendationQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      sendError(response, 400, "VALIDATION_ERROR", "Invalid recommendation filters", parsed.error.flatten());
      return;
    }

    const [currentPet] = await db.select({ id: pets.id, species: pets.species })
      .from(pets).where(eq(pets.slug, request.params.slug)).limit(1);
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
    const [pet] = await db.select().from(pets).where(eq(pets.slug, request.params.slug)).limit(1);
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

    const [pet] = await db
      .select({ id: pets.id, status: pets.status })
      .from(pets)
      .where(eq(pets.id, parsed.data.petId))
      .limit(1);
    if (!pet) {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }
    if (pet.status !== "available") {
      sendError(response, 409, "PET_UNAVAILABLE", "Applications are only accepted for available pets");
      return;
    }

    const [application] = await db
      .insert(applications)
      .values({
        petId: parsed.data.petId,
        applicantName: parsed.data.applicantName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        area: parsed.data.area,
        message: parsed.data.message,
        housingType: parsed.data.housingType,
      })
      .returning();
    sendData(response, application, 201);
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

    const [pet] = await db
      .update(pets)
      .set({
        ...parsed.data,
        ...(parsed.data.breed === undefined ? {} : { breed: parsed.data.breed }),
        ...(parsed.data.ageMonths === undefined ? {} : { ageMonths: parsed.data.ageMonths }),
        ...(parsed.data.gender === undefined ? {} : { gender: parsed.data.gender }),
        ...(parsed.data.size === undefined ? {} : { size: parsed.data.size }),
        updatedAt: new Date(),
      })
      .where(eq(pets.id, parsedId))
      .returning();
    if (!pet) {
      sendError(response, 404, "NOT_FOUND", "Pet not found");
      return;
    }
    sendData(response, pet);
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

function parseUuid(value: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);

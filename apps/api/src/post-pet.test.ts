import test from "node:test";
import assert from "node:assert/strict";
import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { PgDialect } from "drizzle-orm/pg-core";
import { ZodError } from "zod";
import {
  caretakerAvailabilitySchema, caretakerPetEditSchema, petSubmissionSchema, petListQuerySchema,
} from "@hyderabad-paws/shared";

type Call = { operation: string; where?: unknown; values?: unknown };
const calls: Call[] = [];
let results: unknown[][] = [];
const db = {
  select() { return query("select"); },
  insert() { return query("insert"); },
  update() { return query("update"); },
  delete() { return query("delete"); },
  transaction<T>(callback: (tx: unknown) => Promise<T>) { return callback(db); },
};
function query(operation: string) {
  const call: Call = { operation };
  calls.push(call);
  const chain = {
    from() { return chain; }, innerJoin() { return chain; },
    where(value: unknown) { call.where = value; return chain; },
    values(value: unknown) { call.values = value; return chain; },
    set(value: unknown) { call.values = value; return chain; },
    orderBy() { return chain; }, limit() { return chain; }, offset() { return chain; },
    for() { return chain; }, returning() { return chain; },
    then(resolve: (value: unknown[]) => unknown, reject: (error: unknown) => unknown) {
      return Promise.resolve(results.shift() ?? []).then(resolve, reject);
    },
  };
  return chain;
}

const dbPath = require.resolve("./db");
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { db } } as NodeModule;
const { apiRouter } = require("./routes") as typeof import("./routes");
const { signAdminToken } = require("./auth") as typeof import("./auth");

const validSubmission = {
  contactName: "Jane", email: "Jane@Example.com", phone: "9876543210",
  name: "Milo", species: "dog", area: "Hyderabad", description: "A friendly dog",
};

test("strict schemas and status separation", () => {
  assert.equal(petSubmissionSchema.parse(validSubmission).email, "jane@example.com");
  assert.equal(petSubmissionSchema.safeParse({ ...validSubmission, status: "available" }).success, false);
  assert.equal(petSubmissionSchema.safeParse({ ...validSubmission, breed: null }).success, false);
  assert.equal(petSubmissionSchema.safeParse({ ...validSubmission, whatsappConsent: true }).success, false);
  assert.equal(caretakerPetEditSchema.safeParse({ slug: "takeover" }).success, false);
  assert.equal(caretakerPetEditSchema.safeParse({ whatsappNumber: "9876543210" }).success, false);
  assert.equal(caretakerAvailabilitySchema.safeParse({ status: "available" }).success, false);
  assert.equal(petListQuerySchema.safeParse({ status: "hidden" }).success, false);
});

test("manual ownership and review preserve hidden status under authorization", async (t) => {
  process.env.JWT_SECRET = "test-secret-at-least-thirty-two-characters-long";
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(apiRouter);
  const handler: ErrorRequestHandler = (_error, _req, res, _next) => res.status(500).end();
  app.use(handler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const admin = signAdminToken({ id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com" });
  const id = "a1b2c3d4-1234-4123-8123-123456789012";
  const send = (path: string, cookie: string, body: unknown) => fetch(base + path, {
    method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(body),
  });

  calls.length = 0;
  results = [[{ id: "user", email: "owner@example.com" }], [{ id, updatedAt: new Date() }], []];
  const denied = await send(`/caretaker/pets/${id}/edits`, `hyderabad_paws_caretaker=${"a".repeat(43)}`, { name: "New name" });
  assert.equal(denied.status, 404);
  assert.deepEqual(calls.map((call) => call.operation), ["select", "select", "select"]);
  const ownerFilter = new PgDialect().sqlToQuery(calls[2].where as never);
  assert.ok(ownerFilter.params.includes("user"));
  assert.ok(ownerFilter.params.includes(id));

  const stamp = new Date("2026-01-01T00:00:00.000Z");
  calls.length = 0;
  results = [[{ petId: id }], [{ status: "hidden", updatedAt: stamp }], [{
    id, petId: id, caretakerId: "user", status: "pending", kind: "details",
    details: { name: "Changed" }, baseUpdatedAt: stamp,
  }], [{ petId: id }], [], []];
  const review = await send(`/admin/pet-edits/${id}/review`, `hyderabad_paws_admin=${admin}`, { decision: "approve" });
  assert.equal(review.status, 200);
  const petUpdate = calls.find((call) => call.operation === "update")?.values as Record<string, unknown>;
  assert.equal(petUpdate.name, "Changed");
  assert.equal("status" in petUpdate, false);
  assert.equal("slug" in petUpdate, false);

  calls.length = 0;
  results = [[{ petId: id }], [{ status: "hidden", updatedAt: stamp }], [{
    id, petId: id, caretakerId: "user", status: "pending", kind: "republish",
    details: {}, baseUpdatedAt: stamp,
  }], [{ petId: id }], []];
  const republish = await send(`/admin/pet-edits/${id}/review`, `hyderabad_paws_admin=${admin}`, { decision: "approve" });
  assert.equal(republish.status, 200);
  assert.equal(calls.filter((call) => call.operation === "update").length, 1);

  calls.length = 0;
  results = [[{ petId: id }], [{ status: "adopted", updatedAt: new Date(stamp.getTime() + 1) }], [{
    id, petId: id, caretakerId: "user", status: "pending", kind: "details",
    details: { name: "Old" }, baseUpdatedAt: stamp,
  }], [{ petId: id }]];
  const stale = await send(`/admin/pet-edits/${id}/review`, `hyderabad_paws_admin=${admin}`, { decision: "approve" });
  assert.equal(stale.status, 409);
  assert.equal(calls.filter((call) => call.operation === "update").length, 0);

  calls.length = 0;
  results = [[{ id, status: "pending", details: validSubmission, caretakerId: null, petId: null }], [{ id: "published" }], []];
  const approval = await send(`/admin/submissions/${id}/review`, `hyderabad_paws_admin=${admin}`, { decision: "approve" });
  assert.equal(approval.status, 200);
  assert.deepEqual(calls.map((call) => call.operation), ["select", "insert", "update"]);
  const published = calls[1].values as Record<string, unknown>;
  assert.equal(published.whatsappNumber, null);
  assert.equal("email" in published, false);

  calls.length = 0;
  results = [[{ id: "user", email: "owner@example.com" }], [{ id }], [], [{ id: "claim" }]];
  const claim = await send("/caretaker/claims", `hyderabad_paws_caretaker=${"a".repeat(43)}`, { submissionId: id });
  assert.equal(claim.status, 201);
  assert.deepEqual(calls.map((call) => call.operation), ["select", "select", "select", "insert"]);

  calls.length = 0;
  results = [[{ status: "hidden" }]];
  const hiddenPatch = await fetch(`${base}/admin/pets/${id}`, {
    method: "PATCH", headers: { "content-type": "application/json", cookie: `hyderabad_paws_admin=${admin}` },
    body: JSON.stringify({ status: "available" }),
  });
  assert.equal(hiddenPatch.status, 409);
  assert.deepEqual(calls.map((call) => call.operation), ["select"]);

  calls.length = 0;
  results = [[{ id: "user", email: "owner@example.com" }], []];
  const edits = await fetch(`${base}/caretaker/pet-edits`, { headers: { cookie: `hyderabad_paws_caretaker=${"a".repeat(43)}` } });
  assert.equal(edits.status, 200);
  assert.ok(new PgDialect().sqlToQuery(calls[1].where as never).params.includes("user"));

  calls.length = 0;
  results = [[{ id, petId: id, caretakerId: "old" }], [{ id: "new" }], [{ id }],
    [{ petId: id, caretakerId: "old" }], [], [], [], []];
  const reassignment = await send(`/admin/submissions/${id}/link`, `hyderabad_paws_admin=${admin}`, { email: "new@example.com" });
  assert.equal(reassignment.status, 200);
  assert.deepEqual(calls.map((call) => call.operation), ["select", "select", "select", "select", "update", "update", "update", "update"]);
  assert.deepEqual(calls[5].values, { caretakerId: "new" });

  calls.length = 0;
  results = [[{ status: "hidden", updatedAt: stamp }], [{ caretakerId: "user" }], [{ baseUpdatedAt: stamp }], []];
  const publish = await send(`/admin/pets/${id}/republish`, `hyderabad_paws_admin=${admin}`, {});
  assert.equal(publish.status, 200);
  assert.equal((calls[3].values as Record<string, unknown>).status, "available");

  calls.length = 0;
  results = [[{ id }]];
  const deleted = await fetch(`${base}/admin/submissions/${id}`, {
    method: "DELETE", headers: { cookie: `hyderabad_paws_admin=${admin}` },
  });
  assert.equal(deleted.status, 200);
  assert.deepEqual(calls.map((call) => call.operation), ["delete"]);
});

test("public and protected endpoints enforce privacy and availability", async (t) => {
  process.env.CLOUDINARY_CLOUD_NAME = "example-cloud";
  const app = express();
  app.use(express.json());
  app.use(apiRouter);
  const handler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) res.status(400).json({ data: null, error: { code: "VALIDATION_ERROR" } });
    else res.status(500).end();
  };
  app.use(handler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const post = (path: string, body: unknown) => fetch(base + path, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const dialect = new PgDialect();

  results = [[]]; calls.length = 0;
  const missing = await fetch(`${base}/pets/hidden-pet`);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("cache-control"), "no-store");
  assert.ok(dialect.sqlToQuery(calls[0].where as never).params.includes("hidden"));

  results = [[]]; calls.length = 0;
  assert.equal((await fetch(`${base}/pets/hidden-pet/recommendations`)).status, 404);
  assert.ok(dialect.sqlToQuery(calls[0].where as never).params.includes("hidden"));
  calls.length = 0;
  assert.equal((await fetch(`${base}/pets?status=hidden`)).status, 400);
  assert.equal(calls.length, 0);

  calls.length = 0;
  assert.equal((await fetch(`${base}/caretaker/pets`)).status, 401);
  assert.equal((await fetch(`${base}/caretaker/applications`)).status, 401);
  assert.equal((await fetch(`${base}/admin/submissions`)).status, 401);
  assert.equal((await fetch(`${base}/admin/pet-edits`)).status, 401);
  assert.equal(calls.length, 0);

  const invalidImage = await post("/pet-submissions", {
    ...validSubmission, images: ["https://evil.example/example-cloud/image/upload/x.jpg"],
  });
  assert.equal(invalidImage.status, 400);
  assert.equal(calls.length, 0);
  results = [[{ id: "submitted-id" }]];
  const submission = await post("/pet-submissions", {
    ...validSubmission, images: ["https://res.cloudinary.com/example-cloud/image/upload/x.jpg"],
  });
  assert.equal(submission.status, 201);
  assert.deepEqual(await submission.json(), { data: { id: "submitted-id" }, error: null });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, "insert");

  calls.length = 0;
  results = [[{ id: "a1b2c3d4-1234-4123-8123-123456789012", status: "hidden" }]];
  const application = await post("/applications", {
    petId: "a1b2c3d4-1234-4123-8123-123456789012", applicantName: "Jane",
    email: "jane@example.com", phone: "9876543210", area: "Hyderabad",
    message: "I would love to adopt", housingType: "house",
  });
  assert.equal(application.status, 404);
  assert.equal(calls.length, 1);
});

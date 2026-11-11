const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");
const { randomUUID } = require("node:crypto");
const schema = require("../dist/db/schema.js");

const databaseUrl = process.env.TEST_DATABASE_URL;

test("moderated submissions, ownership, edits and availability", { skip: !databaseUrl }, async (t) => {
  const parsedUrl = new URL(databaseUrl);
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname), "Integration tests require a local isolated database");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  const dbPath = require.resolve("../dist/db/index.js");
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { db, pool } };
  process.env.JWT_SECRET = "local-integration-test-secret-32-characters";
  const { apiRouter } = require("../dist/routes.js");

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api/v1", apiRouter);
  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: { message: "Internal error" } });
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const suffix = randomUUID();
  const adminEmail = `integration-admin-${suffix}@example.test`;
  const ownerEmail = `integration-owner-${suffix}@example.test`;
  const otherEmail = `integration-other-${suffix}@example.test`;
  const password = "local-test-password";
  let submissionId;
  let petId;
  t.after(async () => {
    try {
      if (submissionId) {
        const found = await pool.query("SELECT pet_id FROM pet_submissions WHERE id = $1", [submissionId]);
        petId ||= found.rows[0]?.pet_id;
        await pool.query("DELETE FROM pet_submissions WHERE id = $1", [submissionId]);
      }
      if (petId) await pool.query("DELETE FROM pets WHERE id = $1", [petId]);
      await pool.query("DELETE FROM caretaker_users WHERE email = ANY($1::text[])", [[ownerEmail, otherEmail]]);
      await pool.query("DELETE FROM admin_users WHERE email = $1", [adminEmail]);
    } finally {
      await pool.end();
    }
  });

  await db.insert(schema.adminUsers).values({
    email: adminEmail,
    passwordHash: await bcrypt.hash(password, 10),
  });

  async function request(path, { method = "GET", data, cookie } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const body = await response.json();
    return { status: response.status, body, cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }

  const submission = {
    contactName: "Test caretaker",
    email: ownerEmail,
    phone: "9876543210",
    name: `Test pet ${suffix}`,
    species: "dog",
    area: "Kondapur",
    description: "A test pet for the isolated integration suite.",
    images: [],
  };
  const created = await request("/pet-submissions", { method: "POST", data: submission });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  submissionId = created.body.data.id;
  assert.ok(submissionId);
  assert.equal((await request("/admin/submissions")).status, 401);

  const adminLogin = await request("/auth/login", { method: "POST", data: { username: adminEmail, password } });
  assert.equal(adminLogin.status, 200, JSON.stringify(adminLogin.body));
  const admin = adminLogin.cookie;
  assert.ok(admin);
  const queue = await request("/admin/submissions", { cookie: admin });
  assert.equal(queue.status, 200);
  const item = queue.body.data.find((entry) => entry.id === submissionId);
  assert.ok(item);
  assert.equal(item.petId, null);
  const before = await request("/pets?species=dog&area=Kondapur&status=available&limit=50");
  assert.ok(!before.body.data.items.some((pet) => pet.name === submission.name));

  const approvals = await Promise.all(Array.from({ length: 2 }, () => request(`/admin/submissions/${submissionId}/review`, {
    method: "POST", cookie: admin, data: { decision: "approve" },
  })));
  assert.deepEqual(approvals.map((entry) => entry.status).sort(), [200, 409], JSON.stringify(approvals));
  const afterQueue = await request("/admin/submissions", { cookie: admin });
  const approvedItem = afterQueue.body.data.find((entry) => entry.id === submissionId);
  assert.ok(approvedItem.petId);
  const publicPets = await request("/pets?species=dog&area=Kondapur&status=available&limit=50");
  const pet = publicPets.body.data.items.find((entry) => entry.id === approvedItem.petId);
  assert.ok(pet);
  petId = pet.id;
  assert.equal(Object.hasOwn(pet, "email"), false);
  assert.equal(Object.hasOwn(pet, "contactName"), false);
  assert.equal(Object.hasOwn(pet, "phone"), false);
  const applicationData = {
    petId: pet.id, applicantName: "Test adopter", email: "adopter@example.test", phone: "9876543210",
    area: "Kondapur", message: "I would like to adopt this pet.", housingType: "Apartment",
  };
  const beforeLinkApplication = await request("/applications", { method: "POST", data: applicationData });
  assert.equal(beforeLinkApplication.status, 201, JSON.stringify(beforeLinkApplication.body));

  const registered = await request("/caretaker/register", { method: "POST", data: { email: ownerEmail, password } });
  assert.ok([200, 201].includes(registered.status), JSON.stringify(registered.body));
  const ownerLogin = await request("/caretaker/login", { method: "POST", data: { email: ownerEmail, password } });
  assert.equal(ownerLogin.status, 200, JSON.stringify(ownerLogin.body));
  const owner = ownerLogin.cookie;
  assert.ok(owner);
  const prelink = await request("/caretaker/pets", { cookie: owner });
  assert.equal(prelink.status, 200);
  assert.ok(!prelink.body.data.some((entry) => entry.id === pet.id), "Email equality must not link ownership");
  assert.ok(!(await request("/caretaker/applications", { cookie: owner })).body.data.some((entry) => entry.petId === pet.id));
  assert.ok([403, 404].includes((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "hidden" },
  })).status));

  const claims = await Promise.all(Array.from({ length: 2 }, () => request("/caretaker/claims", {
    method: "POST", cookie: owner, data: { submissionId },
  })));
  assert.deepEqual(claims.map((entry) => entry.status).sort(), [201, 409], JSON.stringify(claims));
  const claimId = claims.find((entry) => entry.status === 201).body.data.id;
  assert.equal((await request("/admin/claims")).status, 401);
  assert.ok((await request("/admin/claims", { cookie: admin })).body.data.some((entry) =>
    entry.id === claimId && entry.email === ownerEmail && entry.submissionId === submissionId && entry.status === "pending"));
  assert.ok(!(await request("/caretaker/pets", { cookie: owner })).body.data.some((entry) => entry.id === pet.id));
  const linked = await request(`/admin/submissions/${submissionId}/link`, {
    method: "POST", cookie: admin, data: { email: ownerEmail },
  });
  assert.equal(linked.status, 200, JSON.stringify(linked.body));
  assert.ok((await request("/caretaker/pets", { cookie: owner })).body.data.some((entry) => entry.id === pet.id));
  assert.ok((await request("/caretaker/applications", { cookie: owner })).body.data.some((entry) => entry.id === beforeLinkApplication.body.data.id));
  const claimReview = await request(`/admin/claims/${claimId}/review`, {
    method: "POST", cookie: admin, data: { decision: "resolve", note: "Verified" },
  });
  assert.equal(claimReview.status, 200);
  assert.ok((await request("/caretaker/claims", { cookie: owner })).body.data.some((entry) => entry.id === claimId && entry.status === "resolved"));
  const afterLinkApplication = await request("/applications", { method: "POST", data: { ...applicationData, applicantName: "Second adopter" } });
  assert.equal(afterLinkApplication.status, 201);
  assert.ok((await request("/caretaker/applications", { cookie: owner })).body.data.some((entry) => entry.id === afterLinkApplication.body.data.id));

  const otherRegistered = await request("/caretaker/register", { method: "POST", data: { email: otherEmail, password } });
  assert.ok([200, 201].includes(otherRegistered.status));
  const other = (await request("/caretaker/login", { method: "POST", data: { email: otherEmail, password } })).cookie;
  assert.ok(other);
  assert.ok(!(await request("/caretaker/applications", { cookie: other })).body.data.some((entry) => entry.petId === pet.id));
  assert.ok([403, 404].includes((await request(`/caretaker/pets/${pet.id}/edits`, {
    method: "POST", cookie: other, data: { description: "Unauthorized change" },
  })).status));

  const proposed = await request(`/caretaker/pets/${pet.id}/edits`, {
    method: "POST", cookie: owner, data: { description: "A revised description awaiting review." },
  });
  assert.ok([200, 201].includes(proposed.status), JSON.stringify(proposed.body));
  assert.equal((await request(`/pets/${pet.slug}`)).body.data.description, submission.description);
  const edits = await request("/admin/pet-edits", { cookie: admin });
  const edit = edits.body.data.find((entry) => entry.petId === pet.id && entry.status === "pending");
  assert.ok(edit);
  const reviewed = await request(`/admin/pet-edits/${edit.id}/review`, {
    method: "POST", cookie: admin, data: { decision: "approve" },
  });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  assert.equal((await request(`/pets/${pet.slug}`)).body.data.description, "A revised description awaiting review.");

  const staleEdit = await request(`/caretaker/pets/${pet.id}/edits`, {
    method: "POST", cookie: owner, data: { description: "Must not overwrite after hide." },
  });
  assert.equal(staleEdit.status, 201);
  const hidden = await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "hidden" },
  });
  assert.equal(hidden.status, 200, JSON.stringify(hidden.body));
  const staleReview = await request(`/admin/pet-edits/${staleEdit.body.data.id}/review`, {
    method: "POST", cookie: admin, data: { decision: "approve" },
  });
  assert.equal(staleReview.status, 409);
  const stalePet = (await request("/caretaker/pets", { cookie: owner })).body.data.find((entry) => entry.id === pet.id);
  assert.equal(stalePet.status, "hidden");
  assert.equal(stalePet.description, "A revised description awaiting review.");
  assert.equal(stalePet.slug, pet.slug);
  const rejectedStale = await request(`/admin/pet-edits/${staleEdit.body.data.id}/review`, {
    method: "POST", cookie: admin, data: { decision: "reject", note: "Please resubmit after hiding." },
  });
  assert.equal(rejectedStale.status, 200);
  const hiddenToAdopted = await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "adopted" },
  });
  assert.equal(hiddenToAdopted.status, 409);
  assert.equal((await request(`/pets/${pet.slug}`)).status, 404);
  assert.ok(!(await request("/pets?species=dog&area=Kondapur&status=available&limit=50")).body.data.items.some((entry) => entry.id === pet.id));
  assert.equal((await request(`/pets/${pet.slug}/recommendations`)).status, 404);
  const hiddenEdit = await request(`/caretaker/pets/${pet.id}/edits`, {
    method: "POST", cookie: owner, data: { description: "Approved while hidden." },
  });
  assert.equal(hiddenEdit.status, 201, JSON.stringify(hiddenEdit.body));
  const hiddenReview = await request(`/admin/pet-edits/${hiddenEdit.body.data.id}/review`, {
    method: "POST", cookie: admin, data: { decision: "approve" },
  });
  assert.equal(hiddenReview.status, 200, JSON.stringify(hiddenReview.body));
  const hiddenRecord = (await request("/caretaker/pets", { cookie: owner })).body.data.find((entry) => entry.id === pet.id);
  assert.equal(hiddenRecord.description, "Approved while hidden.");
  assert.equal(hiddenRecord.status, "hidden");
  assert.equal(hiddenRecord.slug, pet.slug);
  assert.equal((await request(`/pets/${pet.slug}`)).status, 404);
  async function republish(status) {
    const bypass = await request(`/admin/pets/${pet.id}`, { method: "PATCH", cookie: admin, data: { status: "available" } });
    assert.equal(bypass.status, 409, JSON.stringify(bypass.body));
    const withoutReview = await request(`/admin/pets/${pet.id}/republish`, { method: "POST", cookie: admin, data: {} });
    assert.equal(withoutReview.status, 409);
    const proposals = await Promise.all(Array.from({ length: 2 }, () => request(`/caretaker/pets/${pet.id}/availability`, {
      method: "POST", cookie: owner, data: { status: "request_republish" },
    })));
    assert.deepEqual(proposals.map((entry) => entry.status).sort(), [200, 409], JSON.stringify(proposals));
    const pending = (await request("/admin/pet-edits", { cookie: admin })).body.data
      .filter((entry) => entry.petId === pet.id && entry.kind === "republish" && entry.status === "pending");
    assert.equal(pending.length, 1);
    const reviews = await Promise.all(Array.from({ length: 2 }, () => request(`/admin/pet-edits/${pending[0].id}/review`, {
      method: "POST", cookie: admin, data: { decision: "approve" },
    })));
    assert.deepEqual(reviews.map((entry) => entry.status).sort(), [200, 409], JSON.stringify(reviews));
    assert.equal((await request("/caretaker/pets", { cookie: owner })).body.data.find((entry) => entry.id === pet.id).status, status);
    const publishes = await Promise.all(Array.from({ length: 2 }, () => request(`/admin/pets/${pet.id}/republish`, {
      method: "POST", cookie: admin, data: {},
    })));
    assert.deepEqual(publishes.map((entry) => entry.status).sort(), [200, 409], JSON.stringify(publishes));
    assert.equal((await request(`/pets/${pet.slug}`)).body.data.status, "available");
  }
  await republish("hidden");
  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "adopted" },
  })).status, 200);
  const adoptedEnquiry = await request("/applications", { method: "POST", data: applicationData });
  assert.equal(adoptedEnquiry.status, 409);
  const adoptedBypass = await request(`/admin/pets/${pet.id}`, { method: "PATCH", cookie: admin, data: { status: "hidden" } });
  assert.equal(adoptedBypass.status, 409);
  await republish("adopted");

  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "adopted" },
  })).status, 200);
  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "request_republish" },
  })).status, 200);
  const obsoleteRepublish = (await request("/admin/pet-edits", { cookie: admin })).body.data
    .find((entry) => entry.petId === pet.id && entry.kind === "republish" && entry.status === "pending");
  assert.ok(obsoleteRepublish);
  const adoptedToHidden = await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "hidden" },
  });
  assert.equal(adoptedToHidden.status, 200, JSON.stringify(adoptedToHidden.body));
  assert.equal((await request(`/pets/${pet.slug}`)).status, 404);
  assert.equal((await request("/applications", { method: "POST", data: applicationData })).status, 404);
  assert.equal((await request("/admin/pet-edits", { cookie: admin })).body.data
    .find((entry) => entry.id === obsoleteRepublish.id).status, "rejected");
  await republish("hidden");

  const recoveryClaim = await request("/caretaker/claims", { method: "POST", cookie: other, data: { submissionId } });
  assert.equal(recoveryClaim.status, 201, JSON.stringify(recoveryClaim.body));
  assert.ok(!(await request("/caretaker/applications", { cookie: other })).body.data.some((entry) => entry.petId === pet.id));
  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "hidden" },
  })).status, 200);
  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "request_republish" },
  })).status, 200);
  const oldPending = (await request("/admin/pet-edits", { cookie: admin })).body.data
    .find((entry) => entry.petId === pet.id && entry.kind === "republish" && entry.status === "pending");
  assert.ok(oldPending);
  const reassigned = await request(`/admin/submissions/${submissionId}/link`, {
    method: "POST", cookie: admin, data: { email: otherEmail },
  });
  assert.equal(reassigned.status, 200, JSON.stringify(reassigned.body));
  assert.equal((await request("/admin/pet-edits", { cookie: admin })).body.data.find((entry) => entry.id === oldPending.id).status, "rejected");
  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: other, data: { status: "request_republish" },
  })).status, 200);
  const newPending = (await request("/admin/pet-edits", { cookie: admin })).body.data
    .find((entry) => entry.petId === pet.id && entry.kind === "republish" && entry.status === "pending");
  assert.ok(newPending);
  assert.equal((await request(`/admin/pet-edits/${newPending.id}/review`, {
    method: "POST", cookie: admin, data: { decision: "approve" },
  })).status, 200);
  assert.equal((await request(`/admin/pets/${pet.id}/republish`, {
    method: "POST", cookie: admin, data: {},
  })).status, 200);
  assert.ok(!(await request("/caretaker/pets", { cookie: owner })).body.data.some((entry) => entry.id === pet.id));
  assert.ok(!(await request("/caretaker/applications", { cookie: owner })).body.data.some((entry) => entry.petId === pet.id));
  assert.ok(!(await request("/caretaker/pet-edits", { cookie: other })).body.data.some((entry) => entry.id === oldPending.id));
  assert.ok((await request("/caretaker/applications", { cookie: other })).body.data.some((entry) => entry.id === beforeLinkApplication.body.data.id));
  assert.equal((await request(`/caretaker/pets/${pet.id}/availability`, {
    method: "POST", cookie: owner, data: { status: "hidden" },
  })).status, 404);
  assert.equal((await request(`/admin/claims/${recoveryClaim.body.data.id}/review`, {
    method: "POST", cookie: admin, data: { decision: "resolve" },
  })).status, 200);

  const racing = await Promise.all([
    request(`/caretaker/pets/${pet.id}/availability`, { method: "POST", cookie: other, data: { status: "hidden" } }),
    request("/applications", { method: "POST", data: applicationData }),
  ]);
  assert.equal(racing[0].status, 200, JSON.stringify(racing));
  assert.ok([201, 404].includes(racing[1].status), JSON.stringify(racing));
  assert.equal((await request(`/pets/${pet.slug}`)).status, 404);

  const deletion = await request(`/admin/submissions/${submissionId}`, { method: "DELETE", cookie: admin });
  assert.equal(deletion.status, 200, JSON.stringify(deletion.body));
  assert.ok((await request("/caretaker/pets", { cookie: other })).body.data.some((entry) => entry.id === pet.id));
  assert.ok(!(await request("/admin/claims", { cookie: admin })).body.data.some((entry) => entry.submissionId === submissionId));
});

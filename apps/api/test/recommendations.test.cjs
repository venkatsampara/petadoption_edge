const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { PgDialect } = require("drizzle-orm/pg-core");

const calls = [];
let results = [];
const db = {
  select(selection) {
    const call = { selection };
    calls.push(call);
    return {
      from() { return this; },
      where(condition) { call.where = condition; return this; },
      orderBy(...order) { call.order = order; return this; },
      limit(limit) {
        call.limit = limit;
        return Promise.resolve(results.shift());
      },
    };
  },
};
const dbPath = require.resolve("../dist/db/index.js");
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { db } };
const { apiRouter } = require("../dist/routes.js");

test("recommendation endpoint filters candidates and returns them in enquiry order", async (t) => {
  const app = express();
  app.use(apiRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dialect = new PgDialect();

  results = [
    [{ id: "current-id", species: "dog" }],
    [
      { pet: { name: "Local" }, popularity: 2 },
      { pet: { name: "Popular" }, popularity: 8 },
      { pet: { name: "Another" }, popularity: 1 },
    ],
  ];
  const response = await fetch(`${base}/pets/current/recommendations?species=cat,dog&sizes=small&area=Kondapur`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.map((pet) => pet.name), ["Popular", "Local", "Another"]);
  assert.equal(calls[1].limit, 5);
  const filter = dialect.sqlToQuery(calls[1].where);
  assert.match(filter.sql, /"status" =/);
  assert.match(filter.sql, /"id" <>/);
  assert.match(filter.sql, /"species" in/);
  assert.deepEqual(filter.params, ["available", "current-id", "cat", "dog"]);
  const relevance = dialect.sqlToQuery(calls[1].order[0]);
  assert.ok(relevance.params.includes("Kondapur"));
  assert.ok(relevance.params.includes("small"));
  assert.match(dialect.sqlToQuery(calls[1].order[1]).sql, /count\(\*\).*"applications"/s);

  calls.length = 0;
  results = [[{ id: "current-id", species: "cat" }], []];
  const fallback = await fetch(`${base}/pets/current/recommendations`);
  assert.deepEqual((await fallback.json()).data, []);
  assert.deepEqual(dialect.sqlToQuery(calls[1].where).params, ["available", "current-id", "cat"]);

  calls.length = 0;
  const invalid = await fetch(`${base}/pets/current/recommendations?species=invalid`);
  assert.equal(invalid.status, 400);
  assert.equal(calls.length, 0);

  results = [[]];
  const missing = await fetch(`${base}/pets/missing/recommendations`);
  assert.equal(missing.status, 404);
});

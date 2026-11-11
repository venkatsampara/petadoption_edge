const test = require("node:test");
const assert = require("node:assert/strict");
const { petListQuerySchema } = require("../dist/index.js");

test("validates the supported pet listing filters", () => {
  assert.deepEqual(petListQuerySchema.parse({
    species: "dog",
    area: " Kondapur ",
    size: "small",
    breed: "Indie,Indian Pariah",
    gender: "female",
    minAgeMonths: "0",
    maxAgeMonths: "11",
    page: "1",
    limit: "12",
  }), {
    species: "dog",
    area: "Kondapur",
    size: "small",
    breed: "Indie,Indian Pariah",
    gender: "female",
    minAgeMonths: 0,
    maxAgeMonths: 11,
    status: "available",
    page: 1,
    limit: 12,
  });
});

test("rejects malformed breed and age filters", () => {
  assert.equal(petListQuerySchema.safeParse({ breed: "Indie," }).success, false);
  assert.equal(petListQuerySchema.safeParse({ minAgeMonths: "12", maxAgeMonths: "11" }).success, false);
  assert.equal(petListQuerySchema.safeParse({ minAgeMonths: "-1" }).success, false);
});

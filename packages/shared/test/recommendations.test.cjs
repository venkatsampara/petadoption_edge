const test = require("node:test");
const assert = require("node:assert/strict");
const { addPetSearch, petSearchHistorySchema, recommendationPreferences, recommendationQuerySchema } = require("../dist/index.js");

test("keeps the five most recent distinct searches and preserves history on an unfiltered search", () => {
  let history = [];
  for (const area of ["A", "B", "C", "D", "E", "F"]) {
    history = addPetSearch(history, { area });
  }
  assert.deepEqual(history.map((item) => item.area), ["F", "E", "D", "C", "B"]);
  history = addPetSearch(history, { area: "D" });
  assert.deepEqual(history.map((item) => item.area), ["D", "F", "E", "C", "B"]);
  assert.deepEqual(addPetSearch(history, {}), history);
  assert.equal(petSearchHistorySchema.safeParse([...history, { area: "A" }]).success, false);
});

test("uses recent search preferences and the most recently selected neighbourhood", () => {
  const history = [
    { species: "cat", size: "small" },
    { species: "dog", area: "Kondapur" },
    { species: "cat", size: "large", area: "Madhapur" },
  ];
  assert.deepEqual(recommendationPreferences(history), {
    species: ["cat", "dog"],
    sizes: ["small", "large"],
    area: "Kondapur",
  });
  assert.deepEqual(recommendationPreferences([]), { species: [], sizes: [], area: undefined });
});

test("validates recommendation filters", () => {
  assert.deepEqual(recommendationQuerySchema.parse({ species: "cat,dog,cat", sizes: "small,large", area: " Kondapur " }), {
    species: ["cat", "dog"],
    sizes: ["small", "large"],
    area: "Kondapur",
  });
  assert.equal(recommendationQuerySchema.safeParse({ species: "cat,invalid" }).success, false);
  assert.equal(recommendationQuerySchema.safeParse({ sizes: "tiny" }).success, false);
  assert.equal(recommendationQuerySchema.safeParse({ area: " " }).success, false);
  assert.equal(recommendationQuerySchema.safeParse({ species: ["cat", "dog"] }).success, false);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeWhatsAppNumber, getWhatsAppLink, petInputSchema, petUpdateSchema } = require("../dist/index.js");

test("normalizes Indian mobile numbers for WhatsApp", () => {
  for (const phone of ["9876543210", "09876543210", "+91 98765 43210", "919876543210"]) {
    assert.equal(normalizeWhatsAppNumber(phone), "919876543210");
  }
  for (const phone of ["1234567890", "+1 9876543210", "98765abc43210", "", "0000000000"]) {
    assert.equal(normalizeWhatsAppNumber(phone), null);
  }
});

test("creates an encoded, unsent message or no link", () => {
  const link = new URL(getWhatsAppLink("9876543210", "Tom & Jerry"));
  assert.equal(link.origin, "https://wa.me");
  assert.equal(link.pathname, "/919876543210");
  assert.equal(link.searchParams.get("text"), "Hello! I am interested in adopting Tom & Jerry. Could you please share more details?");
  assert.equal(getWhatsAppLink(null, "Tom"), null);
  assert.equal(getWhatsAppLink("invalid", "Tom"), null);
});

test("pet validation permits absent or cleared numbers and rejects invalid numbers", () => {
  const pet = { slug: "chinni", name: "Chinni", species: "dog", area: "Gachibowli", description: "A loving dog" };
  assert.equal(petInputSchema.parse(pet).whatsappNumber, undefined);
  assert.equal(petInputSchema.parse({ ...pet, whatsappNumber: "+91 98765 43210" }).whatsappNumber, "919876543210");
  assert.equal(petUpdateSchema.parse({ whatsappNumber: null }).whatsappNumber, null);
  assert.equal(petInputSchema.safeParse({ ...pet, whatsappNumber: "not a number" }).success, false);
});
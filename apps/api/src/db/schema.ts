import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { CaretakerPetEditInput, PetSubmissionInput } from "@hyderabad-paws/shared";

export const pets = pgTable("pets", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  breed: text("breed"),
  ageMonths: integer("age_months"),
  gender: text("gender"),
  size: text("size"),
  area: text("area").notNull(),
  description: text("description").notNull(),
  vaccinated: boolean("vaccinated").default(false).notNull(),
  sterilized: boolean("sterilized").default(false).notNull(),
  status: text("status").default("available").notNull(),
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  petId: uuid("pet_id")
    .references(() => pets.id, { onDelete: "cascade" }),
  applicantName: text("applicant_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  area: text("area").notNull(),
  message: text("message").notNull(),
  housingType: text("housing_type").notNull(),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const caretakerUsers = pgTable("caretaker_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const caretakerSessions = pgTable("caretaker_sessions", {
  id: text("id").primaryKey(),
  caretakerId: uuid("caretaker_id").notNull().references(() => caretakerUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const petOwners = pgTable("pet_owners", {
  petId: uuid("pet_id").primaryKey().references(() => pets.id, { onDelete: "cascade" }),
  caretakerId: uuid("caretaker_id").notNull().references(() => caretakerUsers.id, { onDelete: "cascade" }),
});

export const petSubmissions = pgTable("pet_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  details: jsonb("details").$type<PetSubmissionInput>().notNull(),
  status: text("status").default("pending").notNull(),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => adminUsers.id, { onDelete: "set null" }),
  petId: uuid("pet_id").references(() => pets.id, { onDelete: "set null" }),
  caretakerId: uuid("caretaker_id").references(() => caretakerUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const petEdits = pgTable("pet_edits", {
  id: uuid("id").defaultRandom().primaryKey(),
  petId: uuid("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  caretakerId: uuid("caretaker_id").notNull().references(() => caretakerUsers.id, { onDelete: "cascade" }),
  kind: text("kind").default("details").notNull(),
  details: jsonb("details").$type<CaretakerPetEditInput>().notNull(),
  baseUpdatedAt: timestamp("base_updated_at", { withTimezone: true }),
  status: text("status").default("pending").notNull(),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const caretakerClaims = pgTable("caretaker_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id").notNull().references(() => petSubmissions.id, { onDelete: "cascade" }),
  caretakerId: uuid("caretaker_id").notNull().references(() => caretakerUsers.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

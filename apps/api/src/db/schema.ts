import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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

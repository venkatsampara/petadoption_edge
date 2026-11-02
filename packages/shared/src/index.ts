import { z } from "zod";

export const petSpeciesSchema = z.enum(["dog", "cat", "other"]);
export const petGenderSchema = z.enum(["male", "female"]);
export const petSizeSchema = z.enum(["small", "medium", "large"]);
export const petStatusSchema = z.enum(["available", "pending", "adopted"]);
export const applicationStatusSchema = z.enum([
  "new",
  "reviewing",
  "approved",
  "rejected",
]);

export const petInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
  name: z.string().trim().min(1).max(120),
  species: petSpeciesSchema,
  breed: z.string().trim().max(120).nullable().optional(),
  ageMonths: z.number().int().nonnegative().nullable().optional(),
  gender: petGenderSchema.nullable().optional(),
  size: petSizeSchema.nullable().optional(),
  area: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(10000),
  vaccinated: z.boolean().default(false),
  sterilized: z.boolean().default(false),
  status: petStatusSchema.default("available"),
  images: z.array(z.string().url()).default([]),
});

export const petUpdateSchema = petInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const applicationInputSchema = z.object({
  petId: z.string().uuid(),
  applicantName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  area: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(5000),
  housingType: z.string().trim().min(1).max(120),
});

export const volunteerInputSchema = z.object({
  applicantName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  area: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(5000),
  housingType: z.string().trim().min(1).max(120),
});

export const applicationUpdateSchema = z
  .object({ status: applicationStatusSchema })
  .strict();

export const petListQuerySchema = z.object({
  species: petSpeciesSchema.optional(),
  area: z.string().trim().min(1).max(120).optional(),
  size: petSizeSchema.optional(),
  status: petStatusSchema.default("available"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export const loginInputSchema = z.object({
  // Stored in admin_users.email, which may hold either a username or an email.
  username: z.string().trim().min(3, "Enter your username.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export type PetInput = z.infer<typeof petInputSchema>;
export type PetUpdate = z.infer<typeof petUpdateSchema>;
export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type VolunteerInput = z.infer<typeof volunteerInputSchema>;
export type ApplicationUpdate = z.infer<typeof applicationUpdateSchema>;
export type PetListQuery = z.infer<typeof petListQuerySchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type PetSpecies = z.infer<typeof petSpeciesSchema>;
export type PetStatus = z.infer<typeof petStatusSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

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

// Store Indian mobile numbers in the digit-only international format used by wa.me.
export function normalizeWhatsAppNumber(value: string): string | null {
  if (!/^[\d\s()+-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  const match = /^(?:91|0)?([6-9]\d{9})$/.exec(digits);
  return match ? `91${match[1]}` : null;
}

export function getWhatsAppLink(phone: string | null | undefined, petName: string): string | null {
  const number = phone ? normalizeWhatsAppNumber(phone) : null;
  if (!number) return null;
  const message = `Hello! I am interested in adopting ${petName}. Could you please share more details?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

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
  whatsappNumber: z.string().trim().max(30)
    .refine((value) => normalizeWhatsAppNumber(value) !== null, "Enter a valid Indian mobile number, for example +91 98765 43210.")
    .transform((value) => normalizeWhatsAppNumber(value)!)
    .nullable().optional(),
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
  breed: z.string().trim().min(1).max(120)
    .refine((value) => value.split(",").length <= 5 && value.split(",").every((breed) => breed.trim().length > 0), "Enter one or more exact breed labels")
    .optional(),
  gender: petGenderSchema.optional(),
  minAgeMonths: z.coerce.number().int().nonnegative().max(600).optional(),
  maxAgeMonths: z.coerce.number().int().nonnegative().max(600).optional(),
  status: petStatusSchema.default("available"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
}).refine(
  (query) => query.minAgeMonths === undefined || query.maxAgeMonths === undefined || query.minAgeMonths <= query.maxAgeMonths,
  { message: "Minimum age cannot exceed maximum age", path: ["minAgeMonths"] },
);

export const petSearchSchema = z.object({
  species: petSpeciesSchema.optional(),
  size: petSizeSchema.optional(),
  area: z.string().trim().min(1).max(120).optional(),
});

export const petSearchHistorySchema = z.array(petSearchSchema).max(5);

export const recommendationQuerySchema = z.object({
  species: z.string().max(20).optional().transform((value, context) => {
    const values = value ? value.split(",") : [];
    if (values.some((item) => !petSpeciesSchema.safeParse(item).success)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid species" });
      return z.NEVER;
    }
    return [...new Set(values)];
  }),
  sizes: z.string().max(30).optional().transform((value, context) => {
    const values = value ? value.split(",") : [];
    if (values.some((item) => !petSizeSchema.safeParse(item).success)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid size" });
      return z.NEVER;
    }
    return [...new Set(values)];
  }),
  area: z.string().trim().min(1).max(120).optional(),
});

export type PetSearch = z.infer<typeof petSearchSchema>;

export function addPetSearch(history: PetSearch[], search: PetSearch): PetSearch[] {
  if (!search.species && !search.size && !search.area) return history;
  const key = JSON.stringify(search);
  return [search, ...history.filter((item) => JSON.stringify(item) !== key)].slice(0, 5);
}

export function recommendationPreferences(history: PetSearch[]) {
  return {
    species: [...new Set(history.flatMap((item) => item.species ? [item.species] : []))],
    sizes: [...new Set(history.flatMap((item) => item.size ? [item.size] : []))],
    area: history.find((item) => item.area)?.area,
  };
}

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

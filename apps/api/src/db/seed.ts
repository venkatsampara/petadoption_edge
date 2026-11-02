import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

type PetSeed = {
  slug: string;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string;
  ageMonths: number;
  gender: "male" | "female";
  size: "small" | "medium" | "large";
  area: string;
  description: string;
  vaccinated: boolean;
  sterilized: boolean;
};

const seedPets: PetSeed[] = [
  {
    slug: "bruno-indie-gachibowli",
    name: "Bruno",
    species: "dog",
    breed: "Indie",
    ageMonths: 18,
    gender: "male",
    size: "medium",
    area: "Gachibowli",
    description:
      "A cheerful, people-loving Indie who enjoys long walks and settling in beside you after a busy day.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "mishti-indie-madhapur",
    name: "Mishti",
    species: "dog",
    breed: "Indian Pariah",
    ageMonths: 8,
    gender: "female",
    size: "medium",
    area: "Madhapur",
    description:
      "A curious young Indian Pariah with a gentle nature. She is learning home routines and loves reward-based training.",
    vaccinated: true,
    sterilized: false,
  },
  {
    slug: "chutney-calico-kondapur",
    name: "Chutney",
    species: "cat",
    breed: "Domestic Shorthair",
    ageMonths: 14,
    gender: "female",
    size: "small",
    area: "Kondapur",
    description:
      "A calm calico cat who likes sunny windowsills, soft voices, and taking her time to make new friends.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "sheru-indie-secunderabad",
    name: "Sheru",
    species: "dog",
    breed: "Indie",
    ageMonths: 36,
    gender: "male",
    size: "large",
    area: "Secunderabad",
    description:
      "A loyal, steady companion with good leash manners. Sheru would thrive with a family that enjoys outdoor time.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "ladoo-kitten-banjara-hills",
    name: "Ladoo",
    species: "cat",
    breed: "Domestic Shorthair",
    ageMonths: 5,
    gender: "male",
    size: "small",
    area: "Banjara Hills",
    description:
      "A playful kitten who turns cardboard boxes into adventures and appreciates a patient indoor home.",
    vaccinated: true,
    sterilized: false,
  },
  {
    slug: "tara-indie-hitech-city",
    name: "Tara",
    species: "dog",
    breed: "Indian Pariah",
    ageMonths: 24,
    gender: "female",
    size: "medium",
    area: "Hitech City",
    description:
      "A bright, affectionate dog who enjoys sniffy walks and responds well to kind, consistent guidance.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "pepper-indie-kukatpally",
    name: "Pepper",
    species: "dog",
    breed: "Indie",
    ageMonths: 11,
    gender: "female",
    size: "small",
    area: "Kukatpally",
    description:
      "A petite, lively Indie with a big heart. Pepper is happiest with playtime, company, and a cosy place to nap.",
    vaccinated: true,
    sterilized: false,
  },
  {
    slug: "mowgli-indie-jubilee-hills",
    name: "Mowgli",
    species: "dog",
    breed: "Indian Pariah",
    ageMonths: 48,
    gender: "male",
    size: "large",
    area: "Jubilee Hills",
    description:
      "A thoughtful adult dog who bonds deeply with his people and prefers a predictable, unrushed introduction.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "gudiya-tabby-nallagandla",
    name: "Gudiya",
    species: "cat",
    breed: "Domestic Shorthair",
    ageMonths: 20,
    gender: "female",
    size: "small",
    area: "Nallagandla",
    description:
      "A sweet tabby who enjoys gentle play and quiet company. She is comfortable indoors and uses her litter tray.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "biscuit-indie-attapur",
    name: "Biscuit",
    species: "dog",
    breed: "Indie",
    ageMonths: 7,
    gender: "male",
    size: "medium",
    area: "Attapur",
    description:
      "A friendly pup who is building confidence each day. Biscuit would love a family ready for puppy basics and play.",
    vaccinated: true,
    sterilized: false,
  },
  {
    slug: "sundari-indie-mehdipatnam",
    name: "Sundari",
    species: "dog",
    breed: "Indian Pariah",
    ageMonths: 30,
    gender: "female",
    size: "medium",
    area: "Mehdipatnam",
    description:
      "A gentle adult Indie who adores slow walks and soft bedding. She is affectionate once she feels at home.",
    vaccinated: true,
    sterilized: true,
  },
  {
    slug: "chinni-special-care-gachibowli",
    name: "Chinni",
    species: "dog",
    breed: "Indie",
    ageMonths: 42,
    gender: "female",
    size: "small",
    area: "Gachibowli",
    description:
      "A resilient, loving Indie with a healed hind-leg injury that affects her mobility. She needs a ground-floor home, short gentle walks, and ongoing veterinary guidance.",
    vaccinated: true,
    sterilized: true,
  },
];

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const adminEmail = (process.env.ADMIN_USERNAME ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!databaseUrl) throw new Error("DATABASE_URL is required to seed the database");
  if (!databaseUrl.includes("-pooler")) {
    throw new Error("DATABASE_URL must use the Neon pooled connection host containing '-pooler'");
  }
  if (!databaseUrl.includes("sslmode=require")) {
    throw new Error("DATABASE_URL must include sslmode=require");
  }
  if (!adminEmail) throw new Error("ADMIN_USERNAME is required to seed the admin user");
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 5 });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const pet of seedPets) {
        await client.query(
          `INSERT INTO pets
            (slug, name, species, breed, age_months, gender, size, area, description,
             vaccinated, sterilized, status, images)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'available', '[]'::jsonb)
           ON CONFLICT (slug) DO UPDATE SET
             name = EXCLUDED.name,
             species = EXCLUDED.species,
             breed = EXCLUDED.breed,
             age_months = EXCLUDED.age_months,
             gender = EXCLUDED.gender,
             size = EXCLUDED.size,
             area = EXCLUDED.area,
             description = EXCLUDED.description,
             vaccinated = EXCLUDED.vaccinated,
             sterilized = EXCLUDED.sterilized`,
          [
            pet.slug,
            pet.name,
            pet.species,
            pet.breed,
            pet.ageMonths,
            pet.gender,
            pet.size,
            pet.area,
            pet.description,
            pet.vaccinated,
            pet.sterilized,
          ],
        );
      }

      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await client.query(
        `INSERT INTO admin_users (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [adminEmail, passwordHash],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }

  console.info(`Seeded ${seedPets.length} pets and admin user ${adminEmail}`);
}

seed().catch((error: unknown) => {
  console.error("Database seed failed:", error);
  process.exitCode = 1;
});

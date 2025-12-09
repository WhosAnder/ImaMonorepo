import "dotenv/config";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { hashPassword } from "better-auth/crypto";
import { generateId } from "better-auth";

async function createAndre() {
  const email = "andre@ima.com";
  const password = "andre12";
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id: generateId(),
    name: "Andre",
    email,
    role: "admin",
    passwordHash,
    emailVerified: true,
    active: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Created user:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: admin`);

  process.exit(0);
}

createAndre().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

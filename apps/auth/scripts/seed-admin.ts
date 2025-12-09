import "dotenv/config";
import { db } from "../src/db/client";
import { user, session, account, verification } from "../src/db/schema";
import { auth } from "../src/lib/auth";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  console.log("🧹 Cleaning up database...");

  // Delete all data
  await db.delete(session);
  console.log("✅ Deleted all sessions");

  await db.delete(account);
  console.log("✅ Deleted all accounts");

  await db.delete(verification);
  console.log("✅ Deleted all verifications");

  await db.delete(user);
  console.log("✅ Deleted all users");

  // Create admin user using BetterAuth
  const adminEmail = "andre@ima.com";
  const adminPassword = "andre123"; // Must be at least 8 chars for BetterAuth
  const adminName = "Andre";

  console.log("📝 Creating admin user via BetterAuth...");

  const signUpResponse = await auth.api
    .signUpEmail({
      body: { email: adminEmail, password: adminPassword, name: adminName },
      asResponse: true,
    })
    .catch((err) => {
      console.error("❌ Error creating user:", err);
      return null;
    });

  if (!signUpResponse || !signUpResponse.ok) {
    console.error("❌ Failed to create user");
    process.exit(1);
  }

  // Update role to admin
  const [createdUser] = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);
  if (createdUser) {
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, createdUser.id));
  }

  console.log("✅ Created admin user:");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: admin`);

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

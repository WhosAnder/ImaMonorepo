import "dotenv/config";
import { db } from "../src/db/client";
import { user } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? "admin@ima.com";
  const password = process.env.ADMIN_PASSWORD ?? "adminUser123";
  const name = process.env.ADMIN_NAME ?? "Admin User";
  const role = process.env.ADMIN_ROLE ?? "admin";

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`\nTo update this user's password, use the password reset endpoint.`);
      process.exit(0);
    }

    // Create user using BetterAuth
    console.log("📝 Creating admin user via BetterAuth...");

    const signUpResponse = await auth.api
      .signUpEmail({
        body: { email, password, name },
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
    const [createdUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (createdUser) {
      await db
        .update(user)
        .set({ role })
        .where(eq(user.id, createdUser.id));
    }

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();

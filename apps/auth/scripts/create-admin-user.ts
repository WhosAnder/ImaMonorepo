import "dotenv/config";
import { db } from "../src/db/client";
import { users, accounts } from "../src/db/schema";
import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL ?? "admin@ima.com";
  const password = process.env.ADMIN_PASSWORD ?? "adminUser123";
  const name = process.env.ADMIN_NAME ?? "Admin User";
  const role = process.env.ADMIN_ROLE ?? "admin";

  try {
    // Ensure password hash column exists for login flow
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;`);

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    const existingUser = existingUsers[0];

    const hashedPassword = await hashPassword(password);

    if (existingUser) {
      await db
        .update(users)
        .set({
          name,
          role,
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      const existingAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, existingUser.id));

      if (existingAccounts.length === 0) {
        await db.insert(accounts).values({
          id: nanoid(),
          userId: existingUser.id,
          accountId: email,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await db
          .update(accounts)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(accounts.userId, existingUser.id));
      }

      console.log(`User with email ${email} already existed; password and role updated.`);
      process.exit(0);
    }

    // Create user ID
    const userId = nanoid();

    // Insert user
    await db.insert(users).values({
      id: userId,
      email,
      name,
      role,
      passwordHash: hashedPassword,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert account with hashed password
    await db.insert(accounts).values({
      id: nanoid(),
      userId,
      accountId: email,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();

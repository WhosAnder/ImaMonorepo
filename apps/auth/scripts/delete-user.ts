import "dotenv/config";
import { db } from "../src/db/client";
import { user, account } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function deleteUser() {
  const email = "admin@ima.com";

  try {
    // Find the user
    const foundUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (foundUser.length === 0) {
      console.log(`User with email ${email} does not exist.`);
      return;
    }

    const userId = foundUser[0].id;
    console.log(`Found user: ${userId}`);

    // Delete account (cascade should handle this, but let's be explicit)
    await db.delete(account).where(eq(account.userId, userId));
    console.log("Deleted account");

    // Delete user
    await db.delete(user).where(eq(user.id, userId));
    console.log("Deleted user");

    console.log(
      `✅ User ${email} deleted successfully. You can now recreate it using curl.`,
    );
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    process.exit(1);
  }
}

deleteUser();

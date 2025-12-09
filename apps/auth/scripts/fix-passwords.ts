import "dotenv/config";
import { db } from "../src/db/client";
import { accounts } from "../src/db/schema";
import { eq, isNull } from "drizzle-orm";

async function fixPasswords() {
  try {
    // Find all accounts with null or empty passwords
    const accountsWithIssues = await db
      .select()
      .from(accounts)
      .where(eq(accounts.providerId, "credential"));

    console.log(`Found ${accountsWithIssues.length} credential accounts`);

    for (const account of accountsWithIssues) {
      if (!account.password || account.password.trim() === "") {
        console.log(`⚠️  Account ${account.id} (user: ${account.userId}) has null/empty password`);
        console.log(`   This account needs to be deleted or the password reset`);
      } else {
        // Check if password format looks correct (should be hex.hex format)
        const parts = account.password.split(".");
        if (parts.length !== 2) {
          console.log(`⚠️  Account ${account.id} has invalid password format`);
        }
      }
    }

    console.log("\nTo fix:");
    console.log("1. Delete accounts with invalid passwords:");
    console.log("   DELETE FROM accounts WHERE password IS NULL OR password = '';");
    console.log("2. Or recreate users through Better Auth's sign-up endpoint");
  } catch (error) {
    console.error("❌ Error checking passwords:", error);
    process.exit(1);
  }
}

fixPasswords();


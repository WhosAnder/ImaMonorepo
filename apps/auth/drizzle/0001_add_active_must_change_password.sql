-- Migration: Add active and must_change_password fields
-- Note: has_changed_password was in schema but never in database, so no data migration needed

-- Step 1: Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;

-- Step 2: Drop the old column if it exists (it doesn't exist in production, but this is safe)
ALTER TABLE "users" DROP COLUMN IF EXISTS "has_changed_password";

-- Step 3: Add missing columns to accounts table for better-auth compatibility
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;

-- Step 4: Drop old expires_at column if it exists (replaced by more specific columns)
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "expires_at";

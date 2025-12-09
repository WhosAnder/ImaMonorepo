-- Migration: Clean up database and use only users table
-- Run this script against your database

-- 1. Delete all sessions (they reference users)
DELETE FROM sessions;

-- 2. Delete all accounts
DELETE FROM accounts;

-- 3. Delete all users
DELETE FROM users;

-- 4. Drop accounts table if you want to remove it permanently
-- DROP TABLE IF EXISTS accounts;

-- Note: After running this, you'll need to create a new admin user.
-- You can do this via the register endpoint or by running the seed script.

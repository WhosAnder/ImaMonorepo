import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "../db/client";
import { user, session, account, verification } from "../db/schema";

const authConfig: BetterAuthOptions = {
    database: drizzleAdapter(db, {
        schema: {
            user,
            session,
            account,
            verification,
        },
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin({
            defaultRole: "warehouse",
            adminRoles: ["admin"],
        }),
    ],
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5001',
    basePath: '/auth',
    trustedOrigins: ['http://localhost:3000', 'http://localhost:5001'],
};

export const auth: ReturnType<typeof betterAuth> = betterAuth(authConfig);



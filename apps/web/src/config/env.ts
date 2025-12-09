export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:5001";
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/api$/, "");

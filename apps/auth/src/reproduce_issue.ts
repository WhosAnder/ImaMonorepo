
import { auth } from "./lib/auth";
import { APIError } from "better-auth/api";

async function test() {
    const url = "http://localhost:5001/auth/get-session";
    const req = new Request(url, {
        method: "GET",
    });

    console.log(`Testing URL: ${url}`);
    try {
        const res = await auth.handler(req);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();


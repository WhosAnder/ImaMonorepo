const { MongoClient } = require("mongodb");
const url = "mongodb://mongo:UipYLnFuZmxMsYMtRDWvHOEcMjfzwilL@metro.proxy.rlwy.net:53417";
async function test() {
  console.log("Connecting...");
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log("Success!");
    process.exit(0);
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  }
}
test();

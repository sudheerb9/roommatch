const { initAutterServer } = require("@autter/runtime-node");

const apiKey = process.env.AUTTER_RUNTIME_KEY;
if (!apiKey) {
  return;
}

initAutterServer({
  apiKey,
  endpoint: process.env.AUTTER_ENDPOINT || "https://otlp.autter.dev",
  service: "roommatch-api",
  environment: process.env.NODE_ENV,
  release: process.env.GIT_SHA,
});

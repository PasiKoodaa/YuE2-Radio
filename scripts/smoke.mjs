import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["server.mjs", "--no-open"], {
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
const ready = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Radio did not start in time.\n${output}`)), 8000);
  child.stdout.on("data", (chunk) => {
    output += chunk;
    if (output.includes("RADIO is running locally")) {
      clearTimeout(timer);
      resolve();
    }
  });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.once("exit", (code) => reject(new Error(`Radio exited early with code ${code}.\n${output}`)));
});

try {
  await ready;
  const root = await fetch("http://127.0.0.1:4173/");
  if (!root.ok || !(await root.text()).includes("Local AI airwaves")) throw new Error("Root page failed.");

  const script = await fetch("http://127.0.0.1:4173/app.js");
  if (!script.ok || !script.headers.get("content-type")?.includes("javascript")) throw new Error("App asset failed.");

  const validation = await fetch("http://127.0.0.1:4173/song-validation.js");
  if (!validation.ok || !(await validation.text()).includes("validateSong")) throw new Error("Validation module failed.");

  const audioRequest = await fetch("http://127.0.0.1:4173/audio-request.js");
  if (!audioRequest.ok || !(await audioRequest.text()).includes("createYue2Request")) throw new Error("Yue2 request module failed.");

  const health = await fetch("http://127.0.0.1:4173/local-health");
  const healthJson = await health.json();
  if (!health.ok || healthJson.status !== "ok") throw new Error("Local health endpoint failed.");

  const proxy = await fetch("http://127.0.0.1:4173/proxy/lm/v1/models");
  if (![200, 502].includes(proxy.status)) throw new Error(`Unexpected proxy status: ${proxy.status}`);

  console.log("Radio local server smoke test passed.");
} finally {
  child.kill("SIGTERM");
}

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = [
  "dist/index.html",
  "dist/styles.css",
  "dist/app.js",
  "dist/audio-request.js",
  "dist/song-validation.js",
  "server.mjs",
  "radio.config.json",
  "START-RADIO-WINDOWS.bat",
  "SETUP-RADIO-WINDOWS.bat",
  "scripts/start-windows.ps1",
  "scripts/setup-windows.ps1",
  "audio-cpp-server.example.json",
  "README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md"
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing required files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

for (const file of ["dist/app.js", "dist/audio-request.js", "dist/song-validation.js", "server.mjs", "scripts/check.mjs", "scripts/package.mjs", "scripts/test-validation.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

for (const file of ["radio.config.json", "audio-cpp-server.example.json", ".openai/hosting.json", "package.json"]) {
  JSON.parse(readFileSync(file, "utf8"));
}

const html = readFileSync("dist/index.html", "utf8");
for (const asset of ["./styles.css", "./app.js"]) {
  if (!html.includes(asset)) throw new Error(`dist/index.html does not reference ${asset}`);
}
for (const id of ["queueTarget", "saveSong", "queueList", "historyList", "historyTab", "lyricsContent"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`dist/index.html is missing #${id}`);
}

const app = readFileSync("dist/app.js", "utf8");
if (!app.includes("state.playQueue.length >= state.queueTarget")) throw new Error("App must fill a configurable play-ahead queue.");
if (!app.includes("download = `${safeFileName(track.title)}.wav`")) throw new Error("App must save generated songs as WAV files.");
if (!app.includes("const genreSeeds =")) throw new Error("App must define genre-aware creative seed pools.");
for (const stationId of ["afterglow", "velvet", "metro", "static", "midnight", "mare", "neon", "serein"]) {
  if (!app.includes(`${stationId}: {`)) throw new Error(`Genre seeds are missing for ${stationId}.`);
}
if (!app.includes('localStorage.setItem("radio-history"')) throw new Error("App must persist previous-song history locally.");

const server = readFileSync("server.mjs", "utf8");
if (!server.includes('req.once("aborted", abortUpstream)')) throw new Error("Local proxy must forward client cancellation upstream.");

const setup = readFileSync("scripts/setup-windows.ps1", "utf8");
if (!setup.includes('path = $ModelsDir')) throw new Error("Windows setup must use the Yue2 model directory as its root.");
if (!setup.includes('"yue2.model_gguf" = $MainModelName')) throw new Error("Windows setup must use a relative Yue2 model filename.");
if (!setup.includes('"yue2.vae_gguf" = "yue2-vae-f16.gguf"')) throw new Error("Windows setup must use a relative Yue2 VAE filename.");

console.log("Radio package checks passed.");

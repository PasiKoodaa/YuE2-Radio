import { cpSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, resolve } from "node:path";

const result = spawnSync(process.execPath, ["scripts/check.mjs"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);

mkdirSync("release", { recursive: true });
const output = resolve("release/radio-local-v0.7.0.zip");
const stage = resolve("release/radio-local-v0.7.0");
rmSync(output, { force: true });
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

const files = [
  "dist", "docs", "scripts", ".github", ".gitignore", "LICENSE", "THIRD_PARTY_NOTICES.md",
  "README.md", "package.json", "radio.config.json", "server.mjs", "start-radio.sh",
  "START-RADIO-WINDOWS.bat", "SETUP-RADIO-WINDOWS.bat", "audio-cpp-server.example.json"
];
for (const file of files) cpSync(file, resolve(stage, basename(file)), { recursive: true });

let packaged;
if (process.platform === "win32") {
  packaged = spawnSync("powershell.exe", ["-NoProfile", "-Command", `Compress-Archive -Path '${stage.replaceAll("'", "''")}' -DestinationPath '${output.replaceAll("'", "''")}' -Force`], { stdio: "inherit" });
} else {
  packaged = spawnSync("zip", ["-qr", output, basename(stage)], { cwd: resolve("release"), stdio: "inherit" });
}

if (packaged.status !== 0) {
  console.error("Could not create ZIP. Install the 'zip' command on macOS/Linux, or run on Windows with PowerShell.");
  process.exit(packaged.status || 1);
}
console.log(`Created ${output}`);

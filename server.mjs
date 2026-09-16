import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const ROOT = dirname(fileURLToPath(import.meta.url));
const STATIC_ROOT = resolve(ROOT, "dist");
const CONFIG_PATH = resolve(ROOT, "radio.config.json");
const noOpen = process.argv.includes("--no-open");

const defaults = {
  port: 4173,
  lmStudioBaseUrl: "http://127.0.0.1:1234",
  audioCppBaseUrl: "http://127.0.0.1:8080",
  proxyTimeoutMs: 1_200_000
};

let config = defaults;
try {
  config = { ...defaults, ...JSON.parse(readFileSync(CONFIG_PATH, "utf8")) };
} catch (error) {
  console.warn(`Could not read radio.config.json; using defaults. ${error.message}`);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg"
};

const hopByHopHeaders = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailers", "transfer-encoding", "upgrade", "host", "origin", "referer"
]);

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store"
  });
  res.end(body);
}

function proxyTarget(pathname, search) {
  if (pathname === "/proxy/lm" || pathname.startsWith("/proxy/lm/")) {
    return new URL(pathname.slice("/proxy/lm".length) + search, config.lmStudioBaseUrl);
  }
  if (pathname === "/proxy/audio" || pathname.startsWith("/proxy/audio/")) {
    return new URL(pathname.slice("/proxy/audio".length) + search, config.audioCppBaseUrl);
  }
  return null;
}

async function readRequestBody(req) {
  if (["GET", "HEAD"].includes(req.method || "GET")) return undefined;
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 4 * 1024 * 1024) throw new Error("Request body is larger than 4 MB.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function handleProxy(req, res, target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("Local proxy request timed out.")), Number(config.proxyTimeoutMs) || defaults.proxyTimeoutMs);
  const abortUpstream = () => {
    if (!controller.signal.aborted) controller.abort();
  };
  const handleResponseClose = () => {
    if (!res.writableEnded) abortUpstream();
  };
  req.once("aborted", abortUpstream);
  res.once("close", handleResponseClose);
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (!hopByHopHeaders.has(name.toLowerCase()) && value !== undefined) {
        headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    headers.delete("content-length");
    const body = await readRequestBody(req);
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal
    });

    const responseHeaders = {};
    upstream.headers.forEach((value, name) => {
      if (!hopByHopHeaders.has(name.toLowerCase())) responseHeaders[name] = value;
    });
    responseHeaders["cache-control"] = "no-store";
    res.writeHead(upstream.status, responseHeaders);
    if (!upstream.body || req.method === "HEAD") return res.end();
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    if (!res.headersSent && !res.destroyed) {
      json(res, 502, {
        error: {
          message: `Local service unavailable at ${target.origin}. Start the service and try again.`,
          detail: error.message
        }
      });
    } else if (!res.destroyed) res.destroy(error);
  } finally {
    clearTimeout(timeout);
    req.removeListener("aborted", abortUpstream);
    res.removeListener("close", handleResponseClose);
  }
}

function safeStaticPath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const candidate = resolve(STATIC_ROOT, relative);
  return candidate === STATIC_ROOT || candidate.startsWith(`${STATIC_ROOT}${sep}`) ? candidate : null;
}

function serveStatic(req, res, pathname) {
  let filePath = safeStaticPath(pathname);
  if (!filePath) return json(res, 400, { error: { message: "Invalid path." } });
  if (!existsSync(filePath) || !statSync(filePath).isFile()) filePath = resolve(STATIC_ROOT, "index.html");
  const stat = statSync(filePath);
  res.writeHead(200, {
    "content-type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "content-length": stat.size,
    "cache-control": [".html", ".js", ".css"].includes(extname(filePath).toLowerCase()) ? "no-cache" : "public, max-age=3600",
    "x-content-type-options": "nosniff"
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === "win32" ? "cmd" : platform === "darwin" ? "open" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname === "/local-health") {
    return json(res, 200, {
      status: "ok",
      lmStudioBaseUrl: config.lmStudioBaseUrl,
      audioCppBaseUrl: config.audioCppBaseUrl
    });
  }
  const target = proxyTarget(url.pathname, url.search);
  if (target) return handleProxy(req, res, target);
  if (!["GET", "HEAD"].includes(req.method || "GET")) return json(res, 405, { error: { message: "Method not allowed." } });
  return serveStatic(req, res, url.pathname);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use. Radio may already be running at http://127.0.0.1:${config.port}`);
  } else console.error(error);
  process.exitCode = 1;
});

server.listen(Number(config.port) || defaults.port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${Number(config.port) || defaults.port}`;
  console.log("\n  RADIO is running locally");
  console.log(`  ${url}`);
  console.log("  Press Ctrl+C to stop.\n");
  if (!noOpen) setTimeout(() => openBrowser(url), 500);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));

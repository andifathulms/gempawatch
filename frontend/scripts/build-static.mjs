/**
 * Static-export build driver.
 *
 * `next build` with output: "export" prerenders pages in Node, and those pages
 * fetch their data through the static API client. Root-relative URLs have
 * nothing to resolve against in Node, so this serves ./public over loopback for
 * the duration of the build and hands the origin to the client via
 * STATIC_DATA_ORIGIN.
 *
 * Requires the export tree to be in place already:
 *   python manage.py export_static --out ./out
 *   cp -r out/api out/data frontend/public/
 *
 * Usage: node scripts/build-static.mjs
 */
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");

const CONTENT_TYPES = {
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
};

async function main() {
  // Fail early with a clear message rather than 404-ing through the whole build.
  for (const required of ["api/meta/index.json", "data/events.csv"]) {
    try {
      await stat(path.join(PUBLIC_DIR, required));
    } catch {
      console.error(
        `\n✗ Missing public/${required}.\n` +
          `  Run \`manage.py export_static\` and copy out/api and out/data into frontend/public first.\n`,
      );
      process.exit(1);
    }
  }

  const server = createServer(async (req, res) => {
    const rel = decodeURIComponent((req.url ?? "").split("?")[0]);
    const filePath = path.join(PUBLIC_DIR, rel);

    // Refuse anything that escapes the public directory.
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403).end("forbidden");
      return;
    }

    try {
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error("not a file");
      res.writeHead(200, {
        "Content-Type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
        "Content-Length": info.size,
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  console.log(`▸ serving export tree at ${origin} for the build`);

  const child = spawn("npx", ["next", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_DATA_MODE: "static",
      STATIC_DATA_ORIGIN: origin,
    },
  });

  const code = await new Promise((resolve) => child.on("close", resolve));
  server.close();

  if (code !== 0) process.exit(code ?? 1);
  console.log("▸ static export written to ./out");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

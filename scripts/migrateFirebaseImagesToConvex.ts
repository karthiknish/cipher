/**
 * Re-upload Firebase Storage images to Convex file storage and patch document URLs.
 *
 * Usage:
 *   npm run migrate:images
 *   npm run migrate:images -- --prod
 *   npm run migrate:images -- --dry-run
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as path from "path";

const DEV_CONVEX_URL =
  process.env.CONVEX_URL ??
  "https://canny-porcupine-52.eu-west-1.convex.cloud";
const PROD_CONVEX_URL =
  process.env.CONVEX_PROD_URL ??
  "https://glorious-trout-382.eu-west-1.convex.cloud";

type ScanResult = {
  documents: Array<{
    table: string;
    id: string;
    patch: Record<string, unknown>;
  }>;
  urls: string[];
  documentCount: number;
  urlCount: number;
};

function convexRun(
  functionPath: string,
  args: Record<string, unknown>,
  convexUrl: string
): string {
  const dir = mkdtempSync(join(tmpdir(), "cipher-img-migrate-"));
  const file = join(dir, "args.json");
  writeFileSync(file, JSON.stringify(args));

  try {
    const cmd = `npx convex run --url "${convexUrl}" ${functionPath} "$(cat '${file}')"`;
    return execSync(cmd, {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
      shell: "/bin/bash",
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } finally {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

function isLegacyFirebaseUrl(url: string): boolean {
  return (
    url.includes("firebasestorage.googleapis.com") ||
    url.includes("firebasestorage.app") ||
    (url.includes("storage.googleapis.com") && url.includes("cipher-c9c8b"))
  );
}

function replaceUrlsDeep<T>(value: T, map: Record<string, string>): T {
  if (typeof value === "string") {
    if (isLegacyFirebaseUrl(value) && map[value]) {
      return map[value] as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceUrlsDeep(item, map)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = replaceUrlsDeep(nested, map);
    }
    return out as T;
  }
  return value;
}

function guessContentType(url: string, buffer: Buffer): string {
  if (url.includes(".webp")) return "image/webp";
  if (url.includes(".png")) return "image/png";
  if (url.includes(".gif")) return "image/gif";
  if (url.includes(".svg")) return "image/svg+xml";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer.slice(0, 4).toString("ascii") === "RIFF") return "image/webp";
  return "image/jpeg";
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType =
    res.headers.get("content-type")?.split(";")[0]?.trim() ||
    guessContentType(url, buffer);
  return { buffer, contentType };
}

async function uploadToConvex(
  buffer: Buffer,
  contentType: string,
  convexUrl: string
): Promise<string> {
  const uploadUrl = parseJson<string>(
    convexRun("imageMigration:generateMigrationUploadUrl", {}, convexUrl)
  );

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    throw new Error(`Convex upload failed (${res.status})`);
  }

  const { storageId } = (await res.json()) as { storageId: string };
  const publicUrl = parseJson<string>(
    convexRun(
      "imageMigration:getMigrationStorageUrl",
      { storageId },
      convexUrl
    )
  );
  return publicUrl;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const useProd = args.includes("--prod");
  const convexUrl = useProd ? PROD_CONVEX_URL : DEV_CONVEX_URL;

  console.log(`Target: ${useProd ? "PROD" : "DEV"} (${convexUrl})`);
  if (dryRun) console.log("Dry run — no uploads or patches");

  if (!dryRun) {
    console.log("Deploying Convex functions…");
    execSync("npx convex deploy --yes", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
  }

  const scan = parseJson<ScanResult>(
    convexRun("imageMigration:scanLegacyImageUrls", {}, convexUrl)
  );

  console.log(
    `Found ${scan.urlCount} unique Firebase URL(s) across ${scan.documentCount} document(s)`
  );

  if (scan.urlCount === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  const urlMap: Record<string, string> = {};
  let uploaded = 0;
  let failed = 0;

  for (const legacyUrl of scan.urls) {
    if (urlMap[legacyUrl]) continue;
    try {
      console.log(`[${uploaded + failed + 1}/${scan.urlCount}] ${legacyUrl.slice(0, 80)}…`);
      if (dryRun) {
        urlMap[legacyUrl] = legacyUrl;
        continue;
      }
      const { buffer, contentType } = await downloadImage(legacyUrl);
      const newUrl = await uploadToConvex(buffer, contentType, convexUrl);
      urlMap[legacyUrl] = newUrl;
      uploaded++;
      console.log(`  → ${newUrl.slice(0, 80)}…`);
    } catch (err) {
      failed++;
      console.error(`  FAILED:`, err instanceof Error ? err.message : err);
    }
  }

  if (dryRun) {
    console.log("Dry run complete.");
    return;
  }

  let patched = 0;
  for (const doc of scan.documents) {
    const newPatch = replaceUrlsDeep(doc.patch, urlMap);
    const stillLegacy =
      JSON.stringify(newPatch).includes("firebasestorage") ||
      JSON.stringify(newPatch).includes("cipher-c9c8b.firebasestorage");
    if (stillLegacy) {
      console.warn(`Skipping ${doc.table}/${doc.id} — unresolved Firebase URL(s)`);
      continue;
    }
    convexRun(
      "imageMigration:applyImagePatch",
      { table: doc.table, id: doc.id, patch: newPatch },
      convexUrl
    );
    patched++;
  }

  console.log(
    `\nDone. Uploaded ${uploaded}, failed ${failed}, patched ${patched}/${scan.documentCount} documents.`
  );

  const verify = parseJson<ScanResult>(
    convexRun("imageMigration:scanLegacyImageUrls", {}, convexUrl)
  );
  console.log(
    `Remaining: ${verify.urlCount} URL(s) in ${verify.documentCount} document(s)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Grant admin role in Convex (Better Auth).
 *
 * Usage:
 *   npm run set-admin
 *   npm run set-admin -- someone@example.com
 *   npm run set-admin -- --prod
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as path from "path";

const DEFAULT_EMAIL = "karthik.nishanth06@gmail.com";
const DEV_CONVEX_URL =
  process.env.CONVEX_URL ??
  "https://canny-porcupine-52.eu-west-1.convex.cloud";
const PROD_CONVEX_URL =
  process.env.CONVEX_PROD_URL ??
  "https://glorious-trout-382.eu-west-1.convex.cloud";

function convexRun(
  functionPath: string,
  args: Record<string, unknown>,
  convexUrl: string
): string {
  const dir = mkdtempSync(join(tmpdir(), "cipher-set-admin-"));
  const file = join(dir, "args.json");
  writeFileSync(file, JSON.stringify(args));

  try {
    const cmd = `npx convex run --url "${convexUrl}" ${functionPath} "$(cat '${file}')"`;
    return execSync(cmd, {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
      shell: "/bin/bash",
    }).trim();
  } finally {
    try {
      unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const useProd = argv.includes("--prod");
  const email =
    argv.find((a) => a.includes("@")) ?? DEFAULT_EMAIL;
  const convexUrl = useProd ? PROD_CONVEX_URL : DEV_CONVEX_URL;

  console.log(`Target: ${useProd ? "PROD" : "DEV"} (${convexUrl})`);
  console.log(`Setting admin for: ${email}`);

  if (argv.includes("--deploy")) {
    execSync("npx convex deploy --yes", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
  }

  const result = convexRun(
    "adminCli:setAdminByEmail",
    { email },
    convexUrl
  );
  console.log(result);
  console.log("\nUser should sign out and back in if already logged in.");
}

main();

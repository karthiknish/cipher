/**
 * Map Firebase Auth UIDs → Better Auth user IDs in Convex per-user tables.
 *
 * Builds mappings from Firestore `users` (doc id = Firebase UID) + Convex `users` (email).
 *
 * Usage:
 *   npm run remap:users
 *   npm run remap:users -- --dry-run
 *   npm run remap:users -- --prod
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import * as path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const DEV_CONVEX_URL =
  process.env.CONVEX_URL ??
  "https://canny-porcupine-52.eu-west-1.convex.cloud";
const PROD_CONVEX_URL =
  process.env.CONVEX_PROD_URL ??
  "https://glorious-trout-382.eu-west-1.convex.cloud";

type AppUser = { legacyId: string; email: string | null; role: string };
type OrphanScan = { orphaned: string[]; knownCount: number };

function initFirebase() {
  if (getApps().length) return getFirestore();
  const keyPath = path.join(__dirname, "serviceAccountKey.json");
  initializeApp({ credential: cert(keyPath) });
  return getFirestore();
}

function convexRun(
  functionPath: string,
  args: Record<string, unknown>,
  convexUrl: string
): string {
  const dir = mkdtempSync(join(tmpdir(), "cipher-remap-"));
  const file = join(dir, "args.json");
  writeFileSync(file, JSON.stringify(args));

  try {
    const cmd = `npx convex run --url "${convexUrl}" ${functionPath} "$(cat '${file}')"`;
    return execSync(cmd, {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
      shell: "/bin/bash",
      maxBuffer: 10 * 1024 * 1024,
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

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const useProd = argv.includes("--prod");
  const convexUrl = useProd ? PROD_CONVEX_URL : DEV_CONVEX_URL;

  console.log(`Target: ${useProd ? "PROD" : "DEV"} (${convexUrl})`);

  if (!dryRun) {
    execSync("npx convex deploy --yes", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
  }

  const convexUsers = parseJson<AppUser[]>(
    convexRun("adminCli:listAppUsers", {}, convexUrl)
  );
  const byEmail = new Map<string, AppUser>();
  for (const u of convexUsers) {
    if (u.email) byEmail.set(u.email.toLowerCase(), u);
  }

  const db = initFirebase();
  const snap = await db.collection("users").get();

  const mappings: Array<{ fromUserId: string; toUserId: string; email: string }> =
    [];

  for (const doc of snap.docs) {
    const firebaseUid = doc.id;
    const email = String(doc.data().email ?? "").toLowerCase();
    if (!email) continue;

    const convexUser = byEmail.get(email);
    if (!convexUser) continue;
    if (convexUser.legacyId === firebaseUid) continue;
    if (convexUser.legacyId.startsWith("pending_")) continue;

    mappings.push({
      fromUserId: firebaseUid,
      toUserId: convexUser.legacyId,
      email,
    });
  }

  const orphans = parseJson<OrphanScan>(
    convexRun("adminCli:listOrphanedUserIds", {}, convexUrl)
  );

  console.log(`\nConvex users: ${convexUsers.length}`);
  console.log(`Orphaned user IDs in per-user tables: ${orphans.orphaned.length}`);

  const auth = getAuth();
  for (const orphanId of orphans.orphaned.slice(0, 20)) {
    let email = "";
    const fsDoc = await db.collection("users").doc(orphanId).get();
    if (fsDoc.exists) {
      email = String(fsDoc.data()?.email ?? "");
    }
    if (!email) {
      try {
        const user = await auth.getUser(orphanId);
        email = user.email ?? "";
      } catch {
        /* unknown uid */
      }
    }
    console.log(
      `  ${orphanId}${email ? ` (${email})` : ""} — sign in with Better Auth, then re-run remap`
    );
  }

  console.log(`\nEmail-based mappings to apply: ${mappings.length}`);
  for (const m of mappings) {
    console.log(`  ${m.email}: ${m.fromUserId} → ${m.toUserId}`);
  }

  if (mappings.length === 0) {
    console.log("\nNothing to remap.");
    return;
  }

  if (dryRun) {
    console.log("\nDry run — no changes written.");
    return;
  }

  const result = convexRun(
    "adminCli:remapUserIds",
    {
      mappings: mappings.map(({ fromUserId, toUserId }) => ({
        fromUserId,
        toUserId,
      })),
    },
    convexUrl
  );
  console.log(`\n${result}`);

  const after = parseJson<OrphanScan>(
    convexRun("adminCli:listOrphanedUserIds", {}, convexUrl)
  );
  console.log(`Remaining orphaned IDs: ${after.orphaned.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

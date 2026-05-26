/**
 * Batch fixes: useContext→use(), page metadata wrappers, ellipsis, toSorted.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

function walk(dir: string, ext = /\.tsx?$/): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full, ext));
    else if (ext.test(entry)) files.push(full);
  }
  return files;
}

function fixUseContext(file: string): boolean {
  let content = readFileSync(file, "utf8");
  if (!content.includes("useContext")) return false;

  content = content.replace(/\buseContext\b/g, "use");
  // Avoid `import { use, use }` if duplicate
  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']react["']/g,
    (match, imports: string) => {
      const parts = imports
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const p of parts) {
        if (seen.has(p)) continue;
        seen.add(p);
        unique.push(p);
      }
      return `import { ${unique.join(", ")} } from "react"`;
    }
  );

  writeFileSync(file, content, "utf8");
  return true;
}

/** Client page.tsx → page.client.tsx + server page re-exporting layout metadata */
const PAGE_LAYOUT_ROUTES: { page: string; layoutRel: string }[] = [
  { page: "src/app/achievements/page.tsx", layoutRel: "./layout" },
  { page: "src/app/privacy/page.tsx", layoutRel: "./layout" },
  { page: "src/app/features/page.tsx", layoutRel: "./layout" },
  { page: "src/app/challenges/page.tsx", layoutRel: "./layout" },
  { page: "src/app/blog/page.tsx", layoutRel: "./layout" },
  { page: "src/app/checkout/page.tsx", layoutRel: "./layout" },
  { page: "src/app/profile/page.tsx", layoutRel: "./layout" },
  { page: "src/app/login/page.tsx", layoutRel: "./layout" },
  { page: "src/app/creators/page.tsx", layoutRel: "./layout" },
  { page: "src/app/creator/page.tsx", layoutRel: "./layout" },
  { page: "src/app/events/page.tsx", layoutRel: "./layout" },
  { page: "src/app/faqs/page.tsx", layoutRel: "./layout" },
  { page: "src/app/cart/page.tsx", layoutRel: "./layout" },
  { page: "src/app/bundles/page.tsx", layoutRel: "./layout" },
  { page: "src/app/orders/page.tsx", layoutRel: "./layout" },
  { page: "src/app/contact/page.tsx", layoutRel: "./layout" },
  { page: "src/app/shop/page.tsx", layoutRel: "./layout" },
  { page: "src/app/terms/page.tsx", layoutRel: "./layout" },
  { page: "src/app/size-guide/page.tsx", layoutRel: "./layout" },
  { page: "src/app/wishlist/page.tsx", layoutRel: "./layout" },
  { page: "src/app/vote/page.tsx", layoutRel: "./layout" },
  { page: "src/app/blog/[slug]/page.tsx", layoutRel: "./layout" },
  { page: "src/app/shop/[id]/page.tsx", layoutRel: "./layout" },
];

const HOME_METADATA = `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "CIPHER | Premium Streetwear & Urban Fashion" },
  description:
    "Discover premium streetwear with AI-powered virtual try-on. Shop hoodies, tees, outerwear & accessories.",
};

export { default } from "./page.client";
`;

function wrapClientPage(pageRel: string, layoutRel: string): boolean {
  const pagePath = path.join(ROOT, pageRel);
  if (!existsSync(pagePath)) return false;
  const content = readFileSync(pagePath, "utf8");
  if (!/^["']use client["']/.test(content.trimStart())) return false;
  if (content.includes("page.client")) return false;

  const dir = path.dirname(pagePath);
  const clientPath = path.join(dir, "page.client.tsx");
  if (existsSync(clientPath)) return false;

  const layoutPath = path.join(dir, path.basename(layoutRel) === "layout" ? "layout.tsx" : layoutRel);
  if (!existsSync(layoutPath) && layoutRel === "./layout") {
    console.warn(`  skip ${pageRel}: no layout.tsx`);
    return false;
  }

  writeFileSync(clientPath, content, "utf8");
  const serverPage =
    layoutRel === "./layout"
      ? `export { metadata } from "./layout";\nexport { default } from "./page.client";\n`
      : `export { metadata } from "${layoutRel}";\nexport { default } from "./page.client";\n`;
  writeFileSync(pagePath, serverPage, "utf8");
  return true;
}

function fixToSorted(content: string): string {
  return content.replace(/\[\.\.\.([^\]]+)\]\.sort\(/g, "$1.toSorted(");
}

const ELLIPSIS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/>\s*Loading\.\.\.\s*</g, ">Loading…<"],
  [/>\s*Saving\.\.\.\s*</g, ">Saving…<"],
  [/>\s*Deleting\.\.\.\s*</g, ">Deleting…<"],
  [/>\s*Uploading\.\.\.\s*</g, ">Uploading…<"],
  [/>\s*Processing\.\.\.\s*</g, ">Processing…<"],
  [/>\s*Submitting\.\.\.\s*</g, ">Submitting…<"],
  [/>\s*Searching\.\.\.\s*</g, ">Searching…<"],
  [/>\s*Sending\.\.\.\s*</g, ">Sending…<"],
  [/>\s*Generating\.\.\.\s*</g, ">Generating…<"],
  [/Loading\.\.\./g, "Loading…"],
  [/Saving\.\.\./g, "Saving…"],
  [/Deleting\.\.\./g, "Deleting…"],
  [/Uploading\.\.\./g, "Uploading…"],
  [/Processing\.\.\./g, "Processing…"],
  [/Submitting\.\.\./g, "Submitting…"],
  [/PLACING ORDER\.\.\./g, "PLACING ORDER…"],
  [/SUBSCRIBING\.\.\./g, "SUBSCRIBING…"],
  [/THINKING\.\.\./g, "THINKING…"],
  [/SPINNING\.\.\./g, "SPINNING…"],
  [/SIGNING IN\.\.\./g, "SIGNING IN…"],
  [/CREATING ACCOUNT\.\.\./g, "CREATING ACCOUNT…"],
  [/SENDING RESET\.\.\./g, "SENDING RESET…"],
  [/Search by email\.\.\./g, "Search by email…"],
];

function fixJsxEllipsis(content: string): string {
  let out = content;
  for (const [re, rep] of ELLIPSIS_REPLACEMENTS) {
    out = out.replace(re, rep);
  }
  return out;
}

const stats = {
  useContext: 0,
  pages: 0,
  toSorted: 0,
  ellipsis: 0,
};

for (const file of walk(path.join(SRC, "context"))) {
  if (fixUseContext(file)) stats.useContext++;
}

for (const { page, layoutRel } of PAGE_LAYOUT_ROUTES) {
  if (wrapClientPage(page, layoutRel)) stats.pages++;
}

// Home page
const homePage = path.join(SRC, "app/page.tsx");
if (existsSync(homePage)) {
  const home = readFileSync(homePage, "utf8");
  if (/^["']use client["']/.test(home.trimStart()) && !existsSync(path.join(SRC, "app/page.client.tsx"))) {
    writeFileSync(path.join(SRC, "app/page.client.tsx"), home, "utf8");
    writeFileSync(homePage, HOME_METADATA, "utf8");
    stats.pages++;
  }
}

// Routes needing new layout + wrap
const EXTRA_LAYOUTS: Record<string, string> = {
  "src/app/events/[id]/layout.tsx": `import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event",
  description: "Event details and RSVP for CIPHER experiences.",
};

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`,
  "src/app/creators/apply/layout.tsx": `import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as Creator",
  description: "Join the CIPHER creator program and earn from your style.",
};

export default function CreatorApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`,
  "src/app/shop/creator/[username]/layout.tsx": `import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Shop",
  description: "Shop curated picks from a CIPHER creator.",
};

export default function CreatorShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`,
};

for (const [rel, body] of Object.entries(EXTRA_LAYOUTS)) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full)) {
    writeFileSync(full, body, "utf8");
    console.log(`  created ${rel}`);
  }
}

wrapClientPage("src/app/events/[id]/page.tsx", "./layout");
wrapClientPage("src/app/creators/apply/page.tsx", "./layout");
wrapClientPage("src/app/shop/creator/[username]/page.tsx", "./layout");

for (const file of walk(SRC)) {
  let content = readFileSync(file, "utf8");
  const orig = content;
  content = fixToSorted(content);
  if (content !== orig) stats.toSorted++;
  content = fixJsxEllipsis(content);
  if (content !== orig) stats.ellipsis++;
  if (content !== orig) writeFileSync(file, content, "utf8");
}

console.log(stats);

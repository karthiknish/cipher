/**
 * Inline layout metadata onto page.tsx so react-doctor detects it.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");

const PAGES = [
  "src/app/achievements/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/features/page.tsx",
  "src/app/challenges/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/checkout/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/login/page.tsx",
  "src/app/creators/page.tsx",
  "src/app/creator/page.tsx",
  "src/app/events/page.tsx",
  "src/app/faqs/page.tsx",
  "src/app/cart/page.tsx",
  "src/app/bundles/page.tsx",
  "src/app/orders/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/shop/page.tsx",
  "src/app/terms/page.tsx",
  "src/app/size-guide/page.tsx",
  "src/app/wishlist/page.tsx",
  "src/app/vote/page.tsx",
  "src/app/events/[id]/page.tsx",
  "src/app/creators/apply/page.tsx",
  "src/app/shop/creator/[username]/page.tsx",
];

function extractMetadataBlock(layout: string): string | null {
  const constMatch = layout.match(
    /export const metadata:\s*Metadata\s*=\s*(\{[\s\S]*?\n\});/
  );
  if (constMatch) return constMatch[1];

  const genMatch = layout.match(
    /export async function generateMetadata[\s\S]*?\n\}/
  );
  if (genMatch) return null; // handled separately
  return null;
}

function extractGenerateMetadata(layout: string): string | null {
  const genMatch = layout.match(
    /(export async function generateMetadata[\s\S]*?\n\})/
  );
  return genMatch ? genMatch[1] : null;
}

let fixed = 0;

for (const rel of PAGES) {
  const pagePath = path.join(ROOT, rel);
  const dir = path.dirname(pagePath);
  const layoutPath = path.join(dir, "layout.tsx");
  if (!existsSync(pagePath) || !existsSync(layoutPath)) continue;

  const page = readFileSync(pagePath, "utf8");
  const layout = readFileSync(layoutPath, "utf8");

  if (page.includes("export const metadata")) continue;

  const genFn = extractGenerateMetadata(layout);
  if (genFn) {
    const imports = layout.match(/^import[\s\S]*?from "next";/m)?.[0] ?? 'import { Metadata } from "next";';
    const body = `${imports}\n\n${genFn}\n\nexport { default } from "./page.client";\n`;
    writeFileSync(pagePath, body, "utf8");
    fixed++;
    continue;
  }

  const metaObj = extractMetadataBlock(layout);
  if (!metaObj) {
    console.warn(`  skip ${rel}: could not parse metadata`);
    continue;
  }

  const body = `import type { Metadata } from "next";

export const metadata: Metadata = ${metaObj};

export { default } from "./page.client";
`;
  writeFileSync(pagePath, body, "utf8");
  fixed++;
}

// Dynamic routes with generateMetadata in layout
for (const rel of ["src/app/blog/[slug]/page.tsx", "src/app/shop/[id]/page.tsx"]) {
  const pagePath = path.join(ROOT, rel);
  const layoutPath = path.join(path.dirname(pagePath), "layout.tsx");
  if (!existsSync(pagePath) || !existsSync(layoutPath)) continue;
  const layout = readFileSync(layoutPath, "utf8");
  const genFn = extractGenerateMetadata(layout);
  if (!genFn) continue;
  const imports =
    layout.match(/^import[\s\S]*?from "next";/m)?.[0] ?? 'import { Metadata } from "next";';
  const extraImports = layout.includes("await params")
    ? ""
    : "";
  const body = `${imports}\n\n${genFn}\n\nexport { default } from "./page.client";\n`;
  writeFileSync(pagePath, body, "utf8");
  fixed++;
}

console.log(`Inlined metadata on ${fixed} pages`);

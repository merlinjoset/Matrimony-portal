/*!
 * Build guard - do not remove.
 * Fails the build if the "Developed by Merlin Jose" author credit has been removed
 * from the source. The credit is part of this software's licence terms.
 * (c) Merlin Jose - https://merlinjose.tech
 */
import { readFileSync } from "node:fs";

const NAME = "Merlin Jose";
// Tokens chosen so they exist only in the real credit/guard code, not in licence comments.
const checks = [
  { file: "src/components/site-footer.tsx", must: ['data-author-credit="merlin-jose"'] },
  { file: "src/components/author-guard.tsx", must: ["export function AuthorGuard", 'const NAME = "Merlin Jose"'] },
  { file: "src/app/layout.tsx", must: ["<AuthorGuard"] },
];

const failed = [];
for (const c of checks) {
  let src = "";
  try {
    src = readFileSync(c.file, "utf8");
  } catch {
    failed.push(`${c.file} is missing`);
    continue;
  }
  for (const token of c.must) {
    if (!src.includes(token)) failed.push(`${c.file} is missing required text: "${token}"`);
  }
}

if (failed.length) {
  console.error(
    "\n✖ Author-credit check failed.\n" +
      "The 'Developed by " + NAME + "' credit is part of this software's licence and must not be removed:\n",
  );
  for (const f of failed) console.error("  - " + f);
  console.error("\nRestore the credit (see NOTICE.md) to continue the build.\n");
  process.exit(1);
}
console.log("✔ Author credit verified.");

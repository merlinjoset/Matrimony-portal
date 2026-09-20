# Notice — Author Credit

This software was developed by **Merlin Jose** (https://merlinjose.tech).

The **"Developed by Merlin Jose"** author credit displayed in the application
footer is part of this software's licence terms. It **must not be removed,
hidden, or obscured** without the author's written permission.

This is enforced in three ways:

1. **Runtime guard** — `src/components/author-guard.tsx` re-inserts the credit and
   shows a notice if it is removed from the page.
2. **Build check** — `scripts/verify-author-credit.mjs` runs before every build
   (`prebuild`) and **fails the build** if the credit is removed from the source.
   Run it manually with `npm run verify:credit`.
3. **Licence headers** — the credit-bearing source files carry a `@license` notice.

Removing or disabling any of the above does not grant permission to remove the credit.

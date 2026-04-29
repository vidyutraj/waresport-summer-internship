/**
 * On Vercel, NEXTAUTH_URL must be the public https origin. Copy-pasting .env from
 * local often leaves http://localhost:3000 and breaks cookies / callbacks.
 */
if (
  process.env.VERCEL &&
  process.env.VERCEL_URL &&
  (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost"))
) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

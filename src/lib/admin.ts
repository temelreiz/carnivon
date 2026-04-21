/**
 * Admin access is gated by a comma-separated `ADMIN_EMAILS` env var.
 * Keep the list short and out of the bundle — check via this helper in
 * server components / server actions only.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

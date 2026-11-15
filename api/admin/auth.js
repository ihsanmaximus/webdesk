import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_SECRET = process.env.WEBDESK_ADMIN_TOKEN || "";
const COOKIE_NAME = "webdesk_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function sign(value) {
  return createHmac("sha256", ADMIN_SECRET).update(value).digest("base64url");
}
function validSession(req) {
  if (!ADMIN_SECRET) return false;
  const cookies = String(req.headers.cookie || "").split(";").map(x => x.trim());
  const entry = cookies.find(x => x.startsWith(COOKIE_NAME + "="));
  if (!entry) return false;
  const raw = decodeURIComponent(entry.slice(COOKIE_NAME.length + 1));
  const [expires, signature] = raw.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Math.floor(Date.now()/1000)) return false;
  const expected = Buffer.from(sign(expires));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function cookie(value, maxAge) {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function isAdminAuthorized(req) {
  if (validSession(req)) return true;
  // Temporary compatibility for older workspace tabs during rollout.
  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  return Boolean(ADMIN_SECRET && bearer && bearer === ADMIN_SECRET);
}
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (!ADMIN_SECRET) return res.status(503).json({ error: "Konfigurasi otorisasi admin belum tersedia." });
  if (req.method === "GET") return res.status(200).json({ authenticated: validSession(req) });
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  if (body.action === "logout") {
    res.setHeader("Set-Cookie", cookie("", 0));
    return res.status(200).json({ success: true });
  }
  const password = String(body.password || "");
  const supplied = Buffer.from(password);
  const expected = Buffer.from(ADMIN_SECRET);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: "Kata sandi admin tidak cocok." });
  }
  const expires = String(Math.floor(Date.now()/1000) + SESSION_SECONDS);
  res.setHeader("Set-Cookie", cookie(expires + "." + sign(expires), SESSION_SECONDS));
  return res.status(200).json({ success: true, authenticated: true });
}

import { isAdminAuthorized } from "../admin/auth.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBSITE_SLUG = "maxlabtest";

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}
async function db(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: "application/json", ...(options.headers || {}) },
    cache: "no-store"
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) throw Object.assign(new Error(data?.message || data?.hint || "Supabase request failed."), { status: response.status });
  return data;
}
const defaults = {
  version: 1, layout: "background-image", eyebrow: "", headline: "Bangun Sesuatu yang Luar Biasa",
  subheadline: "Perkenalkan bisnis Anda dengan pesan yang jelas, menarik, dan mudah diingat.",
  primaryCtaEnabled: true, primaryCtaLabel: "Hubungi Kami", primaryCtaTarget: "#contact",
  secondaryCtaEnabled: false, secondaryCtaLabel: "Pelajari Lebih Lanjut", secondaryCtaTarget: "#about",
  imageUrl: "", imageAlt: "Background Hero", gradientEnabled: true
};
function normalize(input = {}) {
  const c = { ...defaults, ...(input && typeof input === "object" ? input : {}) };
  for (const key of ["eyebrow","headline","subheadline","primaryCtaLabel","primaryCtaTarget","secondaryCtaLabel","secondaryCtaTarget","imageUrl","imageAlt"]) c[key] = String(c[key] ?? "").slice(0, key === "imageUrl" ? 2000 : 1000);
  c.layout = "background-image";
  c.imageUrl = /^https?:\\/\\//i.test(c.imageUrl) ? c.imageUrl : "";
  for (const key of ["primaryCtaEnabled","secondaryCtaEnabled","gradientEnabled"]) c[key] = Boolean(c[key]);
  return c;
}
export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 503, { error: "Konfigurasi Supabase belum lengkap di Vercel." });
  try {
    const sites = await db(`maxlab_websites?select=id,slug&slug=eq.${WEBSITE_SLUG}&limit=1`);
    if (!sites?.length) return json(res, 404, { error: "Website MaxLab tidak ditemukan." });
    if (req.method === "GET") {
      const rows = await db(`maxlab_hero_configs?select=config,updated_at&website_id=eq.${sites[0].id}&limit=1`);
      return json(res, 200, { config: normalize(rows?.[0]?.config || defaults), updatedAt: rows?.[0]?.updated_at || null });
    }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return json(res, 405, { error: "Method not allowed." }); }
    if (!isAdminAuthorized(req)) return json(res, 401, { error: "Sesi admin tidak valid. Silakan login kembali." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const config = normalize(body.config || body);
    const saved = await db(`maxlab_hero_configs?on_conflict=website_id&select=id,updated_at`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ website_id: sites[0].id, config, updated_at: new Date().toISOString() })
    });
    if (!saved?.length) throw new Error("Konfigurasi Hero tidak berhasil disimpan.");
    return json(res, 200, { success: true, config, updatedAt: saved[0].updated_at });
  } catch (error) {
    console.error("MaxLab Hero API error", error);
    return json(res, error.status || 500, { error: error.message || "Gagal memproses konfigurasi Hero." });
  }
}
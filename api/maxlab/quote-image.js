import { isAdminAuthorized } from "../admin/auth.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBSITE_SLUG = "maxlabtest";
const DEFAULT_CONFIG = { imageUrl: "", quote: { type: "richtext", html: "" } };

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
function sanitizeRichText(value) {
  const html = String(value || "").slice(0, 30000);
  return html
    .replace(/<(script|style|iframe|object|embed|form|svg|math)[^>]*>[\\s\\S]*?<\\/\\1\\s*>/gi, "")
    .replace(/<!--([\\s\\S]*?)-->/g, "")
    .replace(/\\s+on[a-z]+\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)/gi, "")
    .replace(/javascript\\s*:/gi, "")
    .replace(/<(?!\\/?(?:p|br|strong|b|em|i|u|span|div|ul|ol|li)(?:\\s|>|\\/))[^>]*>/gi, "")
    .replace(/\\sstyle\\s*=\\s*("[^"]*"|'[^']*')/gi, (match, quoted) => {
      const style = quoted.slice(1, -1);
      const safe = style.split(";").map(rule => rule.trim()).filter(rule =>
        /^(color|background-color)\\s*:\\s*(#[0-9a-f]{3,8}|[a-z]{3,20}|rgba?\\([0-9.,%\\s]+\\))$/i.test(rule)
      ).join(";");
      return safe ? ` style="${safe}"` : "";
    });
}
function normalize(input = {}) {
  const row = input && typeof input === "object" ? input : {};
  return {
    imageUrl: String(row.imageUrl || "").trim().slice(0, 2200000),
    quote: { type: "richtext", html: sanitizeRichText(row.quote?.html || "") }
  };
}
export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 503, { error: "Konfigurasi Supabase belum lengkap." });
  try {
    const sites = await db(`maxlab_websites?select=id,slug&slug=eq.${WEBSITE_SLUG}&limit=1`);
    if (!sites?.length) return json(res, 404, { error: "Website MaxLab tidak ditemukan." });
    const websiteId = sites[0].id;
    if (req.method === "GET") {
      const rows = await db(`maxlab_quote_image_configs?select=config,status,updated_at&website_id=eq.${websiteId}&limit=1`);
      return json(res, 200, { config: rows?.[0] ? normalize(rows[0].config) : DEFAULT_CONFIG, status: rows?.[0]?.status || null, updatedAt: rows?.[0]?.updated_at || null });
    }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return json(res, 405, { error: "Method not allowed." }); }
    if (!isAdminAuthorized(req)) return json(res, 401, { error: "Sesi admin tidak valid. Silakan login kembali." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.action === "publish") {
      const rows = await db(`maxlab_quote_image_configs?website_id=eq.${websiteId}&select=id,status`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ status: "published", updated_at: new Date().toISOString() })
      });
      if (!rows?.length) return json(res, 409, { error: "Simpan Quote & Image terlebih dahulu." });
      return json(res, 200, { success: true, status: "published" });
    }
    const config = normalize(body.config || body);
    const rows = await db("maxlab_quote_image_configs?on_conflict=website_id&select=updated_at", {
      method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ website_id: websiteId, config, status: "saved", updated_at: new Date().toISOString() })
    });
    if (!rows?.length) throw new Error("Konfigurasi Quote & Image tidak berhasil disimpan.");
    return json(res, 200, { success: true, config, updatedAt: rows[0].updated_at });
  } catch (error) {
    console.error("MaxLab Quote & Image API error", error);
    return json(res, error.status || 500, { error: error.message || "Gagal memproses Quote & Image." });
  }
}

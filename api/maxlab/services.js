import { isAdminAuthorized } from "../admin/auth.js";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBSITE_SLUG = "maxlabtest";
const ICONS = new Set(["heart-pulse","shield-check","users","stethoscope","award","clock","hand-heart","clipboard-check","baby","apple","activity","star"]);
const EMPTY_ITEM = { title: "", description: "", icon: "" };
function json(res, status, body) { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); return res.status(status).json(body); }
async function db(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: "application/json", ...(options.headers || {}) }, cache: "no-store" });
  const raw = await response.text(); let data = null; try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) throw Object.assign(new Error(data?.message || data?.hint || "Supabase request failed."), { status: response.status });
  return data;
}
function normalize(input = {}) {
  const row = input && typeof input === "object" ? input : {};
  const items = Array.isArray(row.items) ? row.items.slice(0, 6) : []; while (items.length < 6) items.push(EMPTY_ITEM);
  return { sectionName: String(row.sectionName ?? "").trim().slice(0,120), headline: String(row.headline ?? "").trim().slice(0,240), subheadline: String(row.subheadline ?? "").trim().slice(0,1200), items: items.map(item => ({ title: String(item?.title ?? "").trim().slice(0,180), description: String(item?.description ?? "").trim().slice(0,1200), icon: ICONS.has(String(item?.icon ?? "")) ? String(item.icon) : "" })) };
}
export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 503, { error: "Konfigurasi Supabase belum lengkap di server." });
  try {
    const sites = await db(`maxlab_websites?select=id,slug&slug=eq.${WEBSITE_SLUG}&limit=1`);
    if (!sites?.length) return json(res, 404, { error: "Website MaxLab tidak ditemukan." });
    const websiteId = sites[0].id;
    if (req.method === "GET") { const rows = await db(`maxlab_services_configs?select=config,status,updated_at&website_id=eq.${websiteId}&limit=1`); return json(res, 200, { config: rows?.[0] ? normalize(rows[0].config) : null, status: rows?.[0]?.status || null, updatedAt: rows?.[0]?.updated_at || null }); }
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return json(res, 405, { error: "Method not allowed." }); }
    if (!isAdminAuthorized(req)) return json(res, 401, { error: "Sesi admin tidak valid. Silakan login kembali." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.action === "publish") {
      const published = await db(`maxlab_services_configs?website_id=eq.${websiteId}&select=id,status`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ status: "published", updated_at: new Date().toISOString() }) });
      if (!published?.length) return json(res, 409, { error: "Simpan konfigurasi Services terlebih dahulu." });
      return json(res, 200, { success: true, status: "published" });
    }
    const config = normalize(body.config || body);
    const saved = await db("maxlab_services_configs?on_conflict=website_id&select=updated_at", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ website_id: websiteId, config, status: "saved", updated_at: new Date().toISOString() }) });
    if (!saved?.length) throw new Error("Konfigurasi Services tidak berhasil disimpan.");
    return json(res, 200, { success: true, config, updatedAt: saved[0].updated_at });
  } catch (error) { console.error("MaxLab Services API error", error); return json(res, error.status || 500, { error: error.message || "Gagal memproses konfigurasi Services." }); }
}
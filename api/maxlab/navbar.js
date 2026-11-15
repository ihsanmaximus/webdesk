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
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) {
    throw Object.assign(new Error(data?.message || data?.hint || "Supabase request failed."), { status: response.status });
  }
  return data;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 503, { error: "Konfigurasi Supabase belum lengkap di Vercel." });

  if (req.method === "GET") {
    try {
      const websites = await db(`maxlab_websites?select=id,name,domain,slug,status&slug=eq.${WEBSITE_SLUG}&limit=1`);
      if (!websites?.length) return json(res, 404, { error: "Website MaxLab Test belum terdaftar." });
      const website = websites[0];
      const configs = await db(`maxlab_navbar_configs?select=*&website_id=eq.${website.id}&order=updated_at.desc&limit=1`);
      if (!configs?.length) return json(res, 200, { website, config: null, menuItems: [] });
      const config = configs[0];
      const menuItems = await db(`maxlab_navbar_menu_items?select=id,label,target_url,sort_order,is_active&navbar_config_id=eq.${config.id}&order=sort_order.asc`);
      return json(res, 200, { website, config, menuItems: menuItems || [] });
    } catch (error) {
      console.error("MaxLab public read error", error);
      return json(res, error.status || 500, { error: error.message || "Gagal mengambil data MaxLab." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  if (!isAdminAuthorized(req)) return json(res, 401, { error: "Sesi admin tidak valid. Silakan login melalui Webdesk." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.action === "publish") {
      const websites = await db(`maxlab_websites?select=id&slug=eq.${WEBSITE_SLUG}&limit=1`);
      if (!websites?.length) return json(res, 404, { error: "Website MaxLab Test belum terdaftar." });
      const latest = await db(`maxlab_navbar_configs?select=id&website_id=eq.${websites[0].id}&order=updated_at.desc&limit=1`);
      if (!latest?.length) return json(res, 409, { error: "Belum ada konfigurasi yang disimpan. Tekan Save terlebih dahulu." });
      const published = await db(`maxlab_navbar_configs?id=eq.${latest[0].id}&select=id,status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ status: "published", updated_at: new Date().toISOString() })
      });
      if (!published?.length) throw new Error("Status Publish tidak berhasil diperbarui.");
      return json(res, 200, { success: true, message: "Navbar berhasil dipublikasikan.", configId: latest[0].id });
    }
    const brandName = String(body.brandName || "").trim().slice(0, 120);
    const whatsappNumber = String(body.whatsappNumber || "").replace(/[^0-9+]/g, "").slice(0, 24);
    const ctaLabel = String(body.ctaLabel || "").trim().slice(0, 80);
    const logoDataUrl = String(body.logoDataUrl || "");
    if (logoDataUrl && (!/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(logoDataUrl) || logoDataUrl.length > 1500000)) {
      return json(res, 400, { error: "Logo harus PNG, JPG, WEBP, atau SVG dengan ukuran maksimal sekitar 1 MB." });
    }
    const menuItems = Array.isArray(body.menuItems) ? body.menuItems.slice(0, 20).map((item, index) => ({
      label: String(item.label || "").trim().slice(0, 80),
      target_url: String(item.targetUrl || "").trim().slice(0, 500),
      sort_order: index,
      is_active: true
    })).filter(item => item.label && item.target_url) : [];

    const websites = await db(`maxlab_websites?select=id&slug=eq.${WEBSITE_SLUG}&limit=1`);
    if (!websites?.length) return json(res, 404, { error: "Website MaxLab Test belum terdaftar." });
    const websiteId = websites[0].id;
    const existing = await db(`maxlab_navbar_configs?select=id,logo_url&website_id=eq.${websiteId}&order=updated_at.desc&limit=1`);
    const payload = {
      website_id: websiteId,
      brand_name: brandName || null,
      logo_url: logoDataUrl || existing?.[0]?.logo_url || null,
      whatsapp_number: whatsappNumber || null,
      cta_label: ctaLabel || null,
      layout_config: {},
      status: "saved",
      updated_at: new Date().toISOString()
    };
    let config;
    if (existing?.length) {
      const rows = await db(`maxlab_navbar_configs?id=eq.${existing[0].id}&select=*`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payload)
      });
      config = rows?.[0];
    } else {
      const rows = await db("maxlab_navbar_configs?select=*", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payload)
      });
      config = rows?.[0];
    }
    if (!config?.id) throw new Error("Konfigurasi Navbar tidak berhasil disimpan.");

    await db(`maxlab_navbar_menu_items?navbar_config_id=eq.${config.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (menuItems.length) {
      await db("maxlab_navbar_menu_items", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(menuItems.map(item => ({ ...item, navbar_config_id: config.id })))
      });
    }
    return json(res, 200, { success: true, message: "Navbar berhasil disimpan ke database.", configId: config.id, menuCount: menuItems.length });
  } catch (error) {
    console.error("MaxLab save error", error);
    return json(res, error.status || 500, { error: error.message || "Gagal menyimpan konfigurasi Navbar." });
  }
}

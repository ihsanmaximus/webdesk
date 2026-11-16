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
    },
    cache: "no-store"
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) {
    throw Object.assign(new Error(data?.message || data?.hint || "Supabase request failed."), { status: response.status });
  }
  return data;
}

const defaults = {
  sectionName: "",
  headline: "",
  subheadline: "",
  education: [{ label: "", degree: "", faculty: "", institution: "" }],
  work: [{ position: "", institution: "", period: "", current: false }],
  experience: [{ role: "", organization: "", detail: "" }]
};

function normalize(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const result = { ...defaults, ...source };
  for (const group of ["education", "work", "experience"]) {
    result[group] = Array.isArray(source[group]) ? source[group].map(item => {
      const row = item && typeof item === "object" ? item : {};
      if (group === "education") return {
        label: String(row.label ?? ""),
        degree: String(row.degree ?? ""),
        faculty: String(row.faculty ?? ""),
        institution: String(row.institution ?? "")
      };
      if (group === "work") return {
        position: String(row.position ?? ""),
        institution: String(row.institution ?? ""),
        period: String(row.period ?? ""),
        current: Boolean(row.current)
      };
      return {
        role: String(row.role ?? ""),
        organization: String(row.organization ?? ""),
        detail: String(row.detail ?? "")
      };
    }) : defaults[group];
  }
  for (const key of ["sectionName", "headline", "subheadline"]) {
    result[key] = String(result[key] ?? "");
  }
  return result;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(res, 503, { error: "Konfigurasi Supabase belum lengkap di Vercel." });
  }

  try {
    const websites = await db(`maxlab_websites?select=id,slug&slug=eq.${WEBSITE_SLUG}&limit=1`);
    if (!websites?.length) return json(res, 404, { error: "Website MaxLab tidak ditemukan." });
    const websiteId = websites[0].id;

    if (req.method === "GET") {
      const rows = await db(`maxlab_experience_configs?select=config,status,updated_at&website_id=eq.${websiteId}&limit=1`);
      return json(res, 200, {
        config: rows?.[0]?.config ? normalize(rows[0].config) : null,
        status: rows?.[0]?.status || null,
        updatedAt: rows?.[0]?.updated_at || null
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return json(res, 405, { error: "Method not allowed." });
    }

    if (!isAdminAuthorized(req)) {
      return json(res, 401, { error: "Sesi admin tidak valid. Silakan login kembali." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const config = normalize(body.config || body);
    const saved = await db("maxlab_experience_configs?on_conflict=website_id&select=id,status,updated_at", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        website_id: websiteId,
        config,
        status: "saved",
        updated_at: new Date().toISOString()
      })
    });

    if (!saved?.length) throw new Error("Konfigurasi Experience tidak berhasil disimpan.");
    return json(res, 200, {
      success: true,
      config,
      status: saved[0].status,
      updatedAt: saved[0].updated_at
    });
  } catch (error) {
    console.error("MaxLab Experience API error", error);
    return json(res, error.status || 500, { error: error.message || "Gagal memproses konfigurasi Experience." });
  }
}

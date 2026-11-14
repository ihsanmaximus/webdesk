// Public minisite renderer data endpoint + registration intake.
// Required Vercel environment variables: SUPABASE_URL, SUPABASE_ANON_KEY.
// Never expose a Supabase service-role key in this function's public response.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", status === 200 ? "public, s-maxage=60, stale-while-revalidate=300" : "no-store");
  return res.json(body);
}

async function supabase(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not configured.");
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || "Supabase request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export default async function handler(req, res) {
  const slug = String(req.query.slug || "").trim().toLowerCase();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return send(res, 400, { error: "Slug tidak valid." });
  }

  try {
    if (req.method === "GET") {
      const rows = await supabase(
        `minisites?select=id,title,slug,description,theme,seo,settings,status,published_at&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
      );
      if (!rows?.length) return send(res, 404, { error: "Minisite tidak ditemukan." });

      const minisite = rows[0];
      const sections = await supabase(
        `minisite_sections?select=id,section_key,section_type,title,sort_order,is_visible,content&minisite_id=eq.${minisite.id}&order=sort_order.asc`
      );
      return send(res, 200, { minisite, sections: sections.filter((section) => section.is_visible) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const rows = await supabase(
        `minisites?select=id&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`
      );
      if (!rows?.length) return send(res, 404, { error: "Minisite tidak ditemukan." });

      const fullName = String(body.full_name || "").trim();
      const whatsapp = String(body.whatsapp || "").trim();
      if (!fullName || !whatsapp) {
        return send(res, 400, { error: "Nama lengkap dan WhatsApp wajib diisi." });
      }

      const inserted = await supabase("minisite_registrations", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          minisite_id: rows[0].id,
          full_name: fullName,
          whatsapp,
          email: body.email ? String(body.email).trim() : null,
          education: body.education ? String(body.education).trim() : null,
          selected_package: body.selected_package ? String(body.selected_package).trim() : null,
          answers: body.answers && typeof body.answers === "object" ? body.answers : {},
        }),
      });
      return send(res, 201, { success: true, registration_id: inserted?.[0]?.id });
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method tidak diizinkan." });
  } catch (error) {
    console.error("Minisite API error:", error);
    return send(res, error.status || 500, {
      error: error.status && error.status < 500 ? error.message : "Terjadi kesalahan pada backend minisite.",
    });
  }
}

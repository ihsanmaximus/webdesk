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
  const identifier = String(req.query.slug || "").trim();
  const isSiteId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier);
  if (!isSiteId && !isSlug) return send(res, 400, { error: "Site ID tidak valid." });

  try {
    if (req.method === "GET") {
      const rows = await supabase(
        `minisites?select=*&${isSiteId ? "id" : "slug"}=eq.${encodeURIComponent(identifier)}&status=eq.published&limit=1`
      );
      if (!rows?.length) return send(res, 404, { error: "Minisite tidak ditemukan atau belum dipublikasikan." });
      const minisite = rows[0];
      const [sections, materials, agenda, speakers, pricing] = await Promise.all([
        supabase(`minisite_sections?select=section_key,section_type,title,sort_order,is_visible&minisite_id=eq.${minisite.id}&order=sort_order.asc`),
        supabase(`minisite_materials?select=title,description,sort_order&minisite_id=eq.${minisite.id}&order=sort_order.asc`),
        supabase(`minisite_agenda?select=day_label,time_label,title,description,sort_order&minisite_id=eq.${minisite.id}&order=sort_order.asc`),
        supabase(`minisite_speakers?select=name,role,bio,topic,image_url,sort_order&minisite_id=eq.${minisite.id}&order=sort_order.asc`),
        supabase(`minisite_pricing?select=name,description,original_price,price,unit_label,badge,features,button_label,is_featured,sort_order&minisite_id=eq.${minisite.id}&order=sort_order.asc`)
      ]);
      return send(res, 200, { minisite, sections, materials, agenda, speakers, pricing });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const rows = await supabase(
        `minisites?select=id&${isSiteId ? "id" : "slug"}=eq.${encodeURIComponent(identifier)}&status=eq.published&limit=1`
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

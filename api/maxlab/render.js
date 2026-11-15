const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
async function db(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: "application/json" },
    cache: "no-store"
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) throw new Error(data?.message || "Gagal mengambil data website.");
  return data;
}
function heroHtml(config) {
  if (!config) return "";
  const c = config;
  const image = c.imageUrl ? esc(c.imageUrl) : "";
  const height = c.height === "compact" ? "360px" : c.height === "medium" ? "480px" : "600px";
  const bgImage = c.layout === "background-image" && image ? `background-image:url('${image}');background-size:cover;background-position:center;` : "";
  const textAlign = c.alignment || "left";
  const safeTarget = value => /^(#|https:\/\/|http:\/\/|mailto:|tel:)/i.test(String(value || "")) ? esc(value) : "#";
  const buttons = `${c.primaryCtaEnabled ? `<a class="hero-cta primary" style="background:${esc(c.accentColor)}" href="${safeTarget(c.primaryCtaTarget || "#contact")}">${esc(c.primaryCtaLabel || "Hubungi Kami")}</a>` : ""}${c.secondaryCtaEnabled ? `<a class="hero-cta secondary" href="${safeTarget(c.secondaryCtaTarget || "#about")}">${esc(c.secondaryCtaLabel || "Pelajari Lebih Lanjut")}</a>` : ""}`;
  const copy = `<div class="hero-copy" style="text-align:${esc(textAlign)}">${c.eyebrow ? `<p class="hero-eyebrow" style="color:${esc(c.eyebrowColor)}">${esc(c.eyebrow)}</p>` : ""}<h1 style="color:${esc(c.headlineColor)}">${esc(c.headline)}</h1><p class="hero-description" style="color:${esc(c.descriptionColor)}">${esc(c.subheadline)}</p><div class="hero-actions">${buttons}</div></div>`;
  let layout = copy;
  if (c.layout === "text-image" && image) layout = `<div class="hero-two-col">${c.imagePosition === "left" ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}${copy}${c.imagePosition !== "left" ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}</div>`;
  if (c.layout === "split-full-bleed") layout = `<div class="hero-split">${c.imagePosition === "left" && image ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}${copy}${c.imagePosition !== "left" && image ? `<img class="hero-image" src="${image}" alt="${esc(c.imageAlt)}">` : ""}</div>`;
  if (c.layout === "text-image" && !image) layout = copy;
  const gradient = c.gradientEnabled ? `<div class="hero-gradient"></div>` : "";
  return `<section class="hero-section ${esc(c.layout)}" style="min-height:${height};background-color:${esc(c.backgroundColor)};color:${esc(c.textColor)};${bgImage}">${gradient}<div class="hero-inner">${layout}</div></section>`;
}
function pageHtml(website, config, menuItems, heroConfig) {
  const brand = config?.brand_name || website.name || "Website";
  const logo = config?.logo_url ? `<img src="${esc(config.logo_url)}" alt="">` : "";
  const menus = (menuItems || []).filter(item => item.is_active !== false).map(item =>
    `<a href="${esc(item.target_url || "#")}">${esc(item.label || "Menu")}</a>`
  ).join("");
  const phone = String(config?.whatsapp_number || "").replace(/[^0-9]/g, "");
  const cta = phone && config?.cta_label
    ? `<a class="cta" href="https://wa.me/${esc(phone)}">${esc(config.cta_label)}</a>` : "";
  return `<!doctype html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow"><title>${esc(brand)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
.site-nav{position:relative;z-index:20;min-height:76px;padding:14px clamp(18px,5vw,72px);display:flex;align-items:center;justify-content:space-between;gap:24px;background:#6b4f3a;border-bottom:1px solid #80634b;color:#fff}
.brand{display:flex;align-items:center;gap:12px;min-width:0;color:#fff;font-weight:750;font-size:18px}.brand img{width:42px;height:42px;object-fit:contain;border-radius:8px}
.nav-links{display:flex;align-items:center;justify-content:center;gap:clamp(14px,2.5vw,34px);flex-wrap:wrap}.nav-links a{color:#fff7ed;text-decoration:none;font-size:14px;font-weight:600}
.nav-links a:hover{color:#e7c99f}.cta{display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border-radius:10px;background:#e4c9a4;color:#493524;text-decoration:none;font-size:14px;font-weight:750;white-space:nowrap}
.nav-toggle{display:none;width:44px;height:44px;padding:9px;border:1px solid rgba(255,255,255,.35);border-radius:9px;background:transparent;color:#fff;cursor:pointer}
.nav-toggle span{display:block;height:2px;margin:6px 0;background:currentColor;border-radius:2px;transition:transform .2s ease,opacity .2s ease}
h1{margin:0 0 10px;font-size:26px}p{margin:0;color:#667085;line-height:1.7}
@media(max-width:767px){.site-nav{min-height:68px;padding:12px 18px;gap:12px}.brand{font-size:17px;flex:1}.nav-toggle{display:block;flex:0 0 44px}
.nav-toggle[aria-expanded="true"] span:nth-child(1){transform:translateY(8px) rotate(45deg)}.nav-toggle[aria-expanded="true"] span:nth-child(2){opacity:0}.nav-toggle[aria-expanded="true"] span:nth-child(3){transform:translateY(-8px) rotate(-45deg)}
.nav-links{position:absolute;top:100%;left:0;right:0;display:none;flex-direction:column;align-items:stretch;gap:0;padding:8px 18px 16px;background:#6b4f3a;border-top:1px solid rgba(255,255,255,.16);box-shadow:0 12px 24px rgba(42,28,18,.2)}
.nav-links.is-open{display:flex;animation:menuDrop .2s ease-out}.nav-links a{display:block;padding:14px 8px;border-bottom:1px solid rgba(255,255,255,.14);font-size:15px}.nav-links a:last-child{border-bottom:0}.cta{padding:10px 13px;font-size:13px}main{margin:28px auto;padding:24px}}
@keyframes menuDrop{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.nav-links.is-open{animation:none}}

/* Hero styling follows the deployed Dokter Faisal hero.css composition. */
.hero-section{position:relative;overflow:hidden;min-height:560px;padding:64px 0 48px;background-color:#eaf5fc;background-size:cover;background-position:center center;background-repeat:no-repeat;color:#14305a}
.hero-section .hero-gradient{position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(90deg,rgba(234,245,252,.96) 0%,rgba(234,245,252,.84) 42%,rgba(234,245,252,.12) 78%,rgba(234,245,252,0) 100%)}
.hero-section .hero-inner{position:relative;z-index:2;display:flex;align-items:center;width:min(1120px,calc(100% - 48px));min-height:440px;margin-inline:auto}
.hero-copy{position:relative;z-index:2;width:52%;max-width:600px;padding:10px 0}
.hero-eyebrow{display:inline-block;margin:0 0 18px;padding:7px 18px;border-radius:999px;background:#d7ebf8;color:#176b9b;font-size:14px;font-weight:700;letter-spacing:0;text-transform:none}
.hero-copy h1{max-width:600px;margin:0 0 20px;color:#123d63;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(42px,5.2vw,64px);font-weight:700;line-height:1.12;letter-spacing:-.01em}
.hero-description{max-width:490px;margin:20px 0 28px;color:#405c73;font-size:18px;line-height:1.65}
.hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:0}
.hero-cta{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 28px;border:2px solid #0b5cad;border-radius:999px;text-decoration:none;font-size:16px;font-weight:600}
.hero-cta.primary{background:#b4c540;border-color:#b4c540;color:#fff}.hero-cta.secondary{background:transparent;border-color:#0b5cad;color:#0b5cad}
@media(max-width:1024px){.hero-section{min-height:500px;padding:44px 0 36px;background-position:55% center}.hero-section .hero-inner{min-height:420px}.hero-copy{width:54%}.hero-copy h1{font-size:clamp(36px,4vw,52px)}}
@media(max-width:767px){.hero-section{min-height:auto;padding:0;background-color:#eaf5fc;background-position:85% top}.hero-section .hero-gradient{background:linear-gradient(180deg,rgba(234,245,252,0) 0%,rgba(234,245,252,0) 65%,#fff 100%)}.hero-section .hero-inner{display:block;width:100%;min-height:0;padding-top:450px}.hero-copy{width:100%;max-width:none;padding:28px 24px 34px;background:rgba(255,255,255,.96);border-radius:28px 28px 0 0}.hero-eyebrow{margin-bottom:14px}.hero-copy h1{font-size:clamp(34px,8vw,42px);line-height:1.15}.hero-description{font-size:17px;margin:14px 0 22px}.hero-actions{flex-direction:column;align-items:flex-start;gap:12px}.hero-actions .hero-cta{width:fit-content;max-width:100%;min-height:48px;padding:12px 22px;font-size:15px;font-weight:500}}
@media(max-width:380px){.hero-section .hero-inner{padding-top:450px}.hero-copy{padding-inline:18px}}
</style></head><body>
<header class="site-nav" id="site-navbar"><div class="brand" id="site-brand">${logo}<span>${esc(brand)}</span></div>
<nav class="nav-links" id="site-menu" aria-label="Navigasi utama">${menus}</nav>${cta}
<button class="nav-toggle" id="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Buka menu"><span></span><span></span><span></span></button></header>
${heroHtml(heroConfig)}
<script>(function(){const b=document.getElementById("nav-toggle"),m=document.getElementById("site-menu");if(!b||!m)return;function setOpen(v){m.classList.toggle("is-open",v);b.setAttribute("aria-expanded",String(v));b.setAttribute("aria-label",v?"Tutup menu":"Buka menu")}b.addEventListener("click",()=>setOpen(!m.classList.contains("is-open")));m.addEventListener("click",e=>{if(e.target.closest("a"))setOpen(false)});document.addEventListener("keydown",e=>{if(e.key==="Escape")setOpen(false)});window.addEventListener("resize",()=>{if(window.innerWidth>767)setOpen(false)})})();</script>
</body></html>`;
}
export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).send("Method not allowed"); }
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(503).send("Konfigurasi Supabase belum lengkap di server.");
  const slug = String(req.query?.slug || "").trim();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return res.status(400).send("Slug website tidak valid.");
  try {
    const websites = await db(`maxlab_websites?select=id,name,domain,slug,status&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    if (!websites?.length) return res.status(404).send("Website tidak ditemukan.");
    const website = websites[0];
    const configs = await db(`maxlab_navbar_configs?select=*&website_id=eq.${website.id}&order=updated_at.desc&limit=1`);
    const config = configs?.[0] || null;
    const menuItems = config ? await db(`maxlab_navbar_menu_items?select=id,label,target_url,sort_order,is_active&navbar_config_id=eq.${config.id}&order=sort_order.asc`) : [];

    // Load the saved Hero configuration for this website and pass it to the renderer.
    const heroRows = await db(`maxlab_hero_configs?select=config&website_id=eq.${website.id}&limit=1`);
    const heroConfig = heroRows?.[0]?.config || null;

    return res.status(200).send(pageHtml(website, config, menuItems || [], heroConfig));
  } catch (error) {
    console.error("MaxLab SSR render error", error);
    return res.status(500).send("Gagal merender halaman website.");
  }
}
